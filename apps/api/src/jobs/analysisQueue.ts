import { AnalysisStatus, FormatType, type Prisma, SourceType } from '@prisma/client'
import { Queue, Worker, type Job } from 'bullmq'
import { env } from '../lib/env.js'
import { prisma } from '../lib/prisma.js'
import { redis } from '../lib/redis.js'
import { getIo } from '../lib/socket.js'
import { logger } from '../utils/logger.js'
import { mlService } from '../services/mlService.js'
import { generateInsights, gradeFromScore } from '../services/insightService.js'
import { sendAnalysisFailedEmail } from '../services/emailService.js'
import { storageService } from '../services/storageService.js'
import { planLimits } from '../utils/constants.js'

interface AnalysisJob {
  analysisId: string
  userId: string
  sourceType: SourceType
  s3Key?: string
  youtubeUrl?: string
}

interface ProgressUpdate {
  status: AnalysisStatus
  progress: number
  currentStep: string
  estimatedSecondsRemaining?: number
}

export const analysisQueue = new Queue<AnalysisJob>('analysis-queue', {
  connection: redis,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
})

function roomName(analysisId: string) {
  return `analysis:${analysisId}`
}

function progressKey(analysisId: string) {
  return `progress:${analysisId}`
}

function normalizeS3Prefix(prefix: string) {
  if (!prefix) return ''
  if (!prefix.startsWith('s3://')) return prefix
  const [, , , ...rest] = prefix.split('/')
  return rest.join('/')
}

function resolveFormatType(durationSeconds: number) {
  if (durationSeconds < 180) return FormatType.SHORT_FORM
  if (durationSeconds > 600) return FormatType.LONG_FORM
  return FormatType.STANDARD
}

export async function emitProgress(analysisId: string, update: ProgressUpdate) {
  await redis.set(progressKey(analysisId), JSON.stringify(update), 'EX', 2 * 60 * 60)

  try {
    const io = getIo()
    io.to(roomName(analysisId)).emit('analysis:progress', {
      analysisId,
      ...update
    })
  } catch {
    // Socket may not be initialized during tests
  }
}

function inferErrorCode(error: unknown) {
  const message = (error as Error)?.message ?? 'Unknown processing error'

  if (/oom|out of memory|cuda/i.test(message)) {
    return 'GPU_OOM'
  }

  if (/audio/i.test(message) && /no/i.test(message)) {
    return 'VIDEO_NO_AUDIO'
  }

  if (/duration|plan/i.test(message)) {
    return 'VIDEO_TOO_LONG_FOR_PLAN'
  }

  return 'ANALYSIS_PIPELINE_ERROR'
}

async function updateStatus(analysisId: string, status: AnalysisStatus, progress: number, currentStep: string, estimatedSecondsRemaining?: number) {
  await prisma.analysis.update({
    where: { id: analysisId },
    data: {
      status,
      ...(status === AnalysisStatus.EXTRACTING_FEATURES ? { processingStartedAt: new Date() } : {})
    }
  })

  await emitProgress(analysisId, {
    status,
    progress,
    currentStep,
    estimatedSecondsRemaining
  })
}

async function processJob(job: Job<AnalysisJob>) {
  const { analysisId, userId, sourceType } = job.data

  const analysis = await prisma.analysis.findUnique({ where: { id: analysisId }, include: { user: true } })

  if (!analysis) {
    throw new Error('Analysis not found')
  }

  let s3Key = analysis.s3Key

  if (sourceType === SourceType.YOUTUBE_URL) {
    await updateStatus(analysisId, AnalysisStatus.DOWNLOADING, 0, 'Downloading YouTube source...')

    // Dev-safe placeholder; production should run yt-dlp and upload real file.
    s3Key = analysis.s3Key ?? `raw/${analysisId}/source.mp4`
    await prisma.analysis.update({
      where: { id: analysisId },
      data: {
        s3Key,
        sourceType: SourceType.YOUTUBE_URL,
        durationSeconds: analysis.durationSeconds ?? 240,
        fileSizeBytes: analysis.fileSizeBytes ?? BigInt(100 * 1024 * 1024)
      }
    })

    await emitProgress(analysisId, {
      status: AnalysisStatus.DOWNLOADING,
      progress: 10,
      currentStep: 'Download complete'
    })
  }

  if (!s3Key) {
    throw new Error('Missing source video key')
  }

  await updateStatus(analysisId, AnalysisStatus.EXTRACTING_FEATURES, 10, 'Extracting audio and video features...', 240)
  const extract = await mlService.extract({
    analysis_id: analysisId,
    s3_key: s3Key,
    s3_bucket: env.S3_BUCKET_NAME,
    duration_seconds: analysis.durationSeconds ?? undefined
  })

  await emitProgress(analysisId, {
    status: AnalysisStatus.EXTRACTING_FEATURES,
    progress: 55,
    currentStep: 'Feature extraction complete'
  })

  const planLimit = planLimits[analysis.user.plan]
  if (extract.duration_seconds > planLimit.maxDurationSeconds) {
    const err = new Error('Video duration exceeds plan limit')
    ;(err as Error & { code?: string }).code = 'VIDEO_TOO_LONG_FOR_PLAN'
    throw err
  }

  await prisma.analysis.update({
    where: { id: analysisId },
    data: {
      durationSeconds: extract.duration_seconds,
      detectedLanguage: extract.detected_language
    }
  })

  await updateStatus(analysisId, AnalysisStatus.RUNNING_TRIBE, 55, 'Running TRIBE v2 neural inference...', 180)
  const infer = await mlService.infer({
    analysis_id: analysisId,
    features_s3_prefix: extract.features_s3_prefix,
    s3_bucket: env.S3_BUCKET_NAME
  })

  await emitProgress(analysisId, {
    status: AnalysisStatus.RUNNING_TRIBE,
    progress: 80,
    currentStep: 'TRIBE inference complete'
  })

  await updateStatus(analysisId, AnalysisStatus.SCORING, 80, 'Computing engagement scores...', 45)
  const score = await mlService.score({
    analysis_id: analysisId,
    raw_output_s3_key: infer.raw_output_s3_key,
    s3_bucket: env.S3_BUCKET_NAME
  })

  await emitProgress(analysisId, {
    status: AnalysisStatus.SCORING,
    progress: 90,
    currentStep: 'Scoring complete'
  })

  await updateStatus(analysisId, AnalysisStatus.GENERATING_INSIGHTS, 90, 'Generating creator insights...', 20)

  const insights = generateInsights(
    score.hook_timeseries,
    score.boredom_timeseries,
    score.emotion_timeseries,
    Math.round(extract.duration_seconds)
  )

  const gradeData = gradeFromScore(score.overall_score)
  const formatType = resolveFormatType(extract.duration_seconds)

  const resultPayload: Prisma.AnalysisResultUncheckedCreateInput = {
    analysisId,
    overallScore: Math.round(score.overall_score),
    hookScore: Math.round(score.hook_score),
    boredomScore: Math.round(score.boredom_score),
    emotionScore: Math.round(score.emotion_score),
    hookTimeseries: score.hook_timeseries as unknown as Prisma.InputJsonValue,
    boredomTimeseries: score.boredom_timeseries as unknown as Prisma.InputJsonValue,
    emotionTimeseries: score.emotion_timeseries as unknown as Prisma.InputJsonValue,
    rawOutputS3Key: null,
    insights: insights as unknown as Prisma.InputJsonValue,
    formatType,
    grade: gradeData.grade,
    gradeSummary: gradeData.summary
  }

  const result = await prisma.analysisResult.upsert({
    where: { analysisId },
    create: resultPayload,
    update: {
      overallScore: resultPayload.overallScore,
      hookScore: resultPayload.hookScore,
      boredomScore: resultPayload.boredomScore,
      emotionScore: resultPayload.emotionScore,
      hookTimeseries: resultPayload.hookTimeseries,
      boredomTimeseries: resultPayload.boredomTimeseries,
      emotionTimeseries: resultPayload.emotionTimeseries,
      rawOutputS3Key: null,
      insights: resultPayload.insights,
      formatType,
      grade: resultPayload.grade,
      gradeSummary: resultPayload.gradeSummary
    }
  })

  // CRITICAL CLEANUP: keep source/processed assets, remove massive intermediates.
  await storageService.deletePrefix(normalizeS3Prefix(extract.features_s3_prefix)).catch((error) => {
    logger.warn({ error, analysisId }, 'Failed to cleanup feature prefix')
  })
  await storageService.deleteKeys([infer.raw_output_s3_key]).catch((error) => {
    logger.warn({ error, analysisId }, 'Failed to cleanup raw TRIBE output')
  })

  await prisma.analysis.update({
    where: { id: analysisId },
    data: {
      status: AnalysisStatus.COMPLETED,
      processingCompletedAt: new Date(),
      errorCode: null,
      errorMessage: null
    }
  })

  const completedUpdate: ProgressUpdate = {
    status: AnalysisStatus.COMPLETED,
    progress: 100,
    currentStep: 'Completed'
  }

  await emitProgress(analysisId, completedUpdate)

  try {
    const io = getIo()
    io.to(roomName(analysisId)).emit('analysis:completed', {
      analysisId,
      result: {
        overallScore: result.overallScore,
        hookScore: result.hookScore,
        boredomScore: result.boredomScore,
        emotionScore: result.emotionScore,
        grade: result.grade,
        gradeSummary: result.gradeSummary
      }
    })
  } catch {
    // no-op
  }

  await redis.del(`analysis:${userId}:${analysisId}`)
}

export function startAnalysisWorker() {
  const worker = new Worker<AnalysisJob>('analysis-queue', processJob, {
    connection: redis,
    concurrency: 2,
    lockDuration: 30 * 60 * 1000
  })

  worker.on('failed', async (job, error) => {
    if (!job) return

    const code = (error as Error & { code?: string }).code ?? inferErrorCode(error)
    const message = (error as Error).message || 'Processing failed unexpectedly'

    logger.error({ error, jobId: job.id, analysisId: job.data.analysisId }, 'Analysis job failed')

    await prisma.analysis.update({
      where: { id: job.data.analysisId },
      data: {
        status: AnalysisStatus.FAILED,
        errorCode: code,
        errorMessage: message,
        processingCompletedAt: new Date()
      }
    })

    await emitProgress(job.data.analysisId, {
      status: AnalysisStatus.FAILED,
      progress: 0,
      currentStep: 'Failed'
    })

    const user = await prisma.user.findUnique({ where: { id: job.data.userId } })
    if (user) {
      await sendAnalysisFailedEmail(user.email, job.data.analysisId, message).catch(() => null)
    }

    try {
      const io = getIo()
      io.to(roomName(job.data.analysisId)).emit('analysis:failed', {
        analysisId: job.data.analysisId,
        errorCode: code,
        errorMessage: message
      })
    } catch {
      // no-op
    }

    await redis.del(`analysis:${job.data.userId}:${job.data.analysisId}`)
  })

  worker.on('error', (error) => {
    logger.error({ error }, 'Analysis worker error')
  })

  return worker
}
