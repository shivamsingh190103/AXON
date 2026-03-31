import { AnalysisStatus, ContentType, FormatType, type Prisma, SourceType } from '@prisma/client'
import { readFile } from 'node:fs/promises'
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
import { youtubeService } from '../services/youtubeService.js'
import { planLimits } from '../utils/constants.js'

interface AnalysisJob {
  analysisId: string
  userId: string
  sourceType: SourceType
  contentType: ContentType
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

function sanitizeFileStem(value: string | null | undefined) {
  const raw = (value ?? '').trim()
  if (!raw) return 'youtube-video'
  const sanitized = raw.replace(/[^a-zA-Z0-9-_]+/g, '_').replace(/^_+|_+$/g, '')
  return sanitized || 'youtube-video'
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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const MOCK_TIMESERIES_MIN_LENGTH = 30
const MOCK_TIMESERIES_MAX_LENGTH = 120

// Score base values and variance for plausible mock distributions
const MOCK_OVERALL_BASE = 55
const MOCK_OVERALL_VARIANCE = 30
const MOCK_HOOK_BASE = 60
const MOCK_HOOK_VARIANCE = 25
const MOCK_BOREDOM_BASE = 25
const MOCK_BOREDOM_VARIANCE = 30
const MOCK_EMOTION_BASE = 55
const MOCK_EMOTION_VARIANCE = 30

function generateMockTimeseries(length: number, base: number, variance: number): number[] {
  const result: number[] = []
  let current = base
  for (let i = 0; i < length; i++) {
    // Random walk centred at zero so the series drifts naturally
    current = Math.max(0, Math.min(100, current + (Math.random() - 0.5) * variance * 2))
    result.push(Math.round(current))
  }
  return result
}

async function mockProcessJob(job: Job<AnalysisJob>) {
  const { analysisId, userId } = job.data

  const analysis = await prisma.analysis.findUnique({ where: { id: analysisId }, include: { user: true } })
  if (!analysis) throw new Error('Analysis not found')

  logger.info({ analysisId }, '[MOCK] Starting mock ML processing')

  await updateStatus(analysisId, AnalysisStatus.EXTRACTING_FEATURES, 10, 'Extracting audio and video features...', 8)
  await delay(1500)

  await emitProgress(analysisId, { status: AnalysisStatus.EXTRACTING_FEATURES, progress: 55, currentStep: 'Feature extraction complete' })
  await delay(1000)

  await updateStatus(analysisId, AnalysisStatus.RUNNING_TRIBE, 55, 'Running TRIBE v2 neural inference...', 5)
  await delay(2000)

  await emitProgress(analysisId, { status: AnalysisStatus.RUNNING_TRIBE, progress: 80, currentStep: 'TRIBE inference complete' })
  await delay(500)

  await updateStatus(analysisId, AnalysisStatus.SCORING, 80, 'Computing engagement scores...', 2)
  await delay(1000)

  await emitProgress(analysisId, { status: AnalysisStatus.SCORING, progress: 90, currentStep: 'Scoring complete' })

  await updateStatus(analysisId, AnalysisStatus.GENERATING_INSIGHTS, 90, 'Generating creator insights...', 1)
  await delay(800)

  const mockDuration = analysis.durationSeconds ?? 120
  const timeseriesLength = Math.max(MOCK_TIMESERIES_MIN_LENGTH, Math.min(MOCK_TIMESERIES_MAX_LENGTH, Math.round(mockDuration)))

  const hookTimeseries = generateMockTimeseries(timeseriesLength, MOCK_HOOK_BASE, 12)
  const boredomTimeseries = generateMockTimeseries(timeseriesLength, MOCK_BOREDOM_BASE, 18)
  const emotionTimeseries = generateMockTimeseries(timeseriesLength, MOCK_EMOTION_BASE, 15)

  const overallScore = Math.round(MOCK_OVERALL_BASE + Math.random() * MOCK_OVERALL_VARIANCE)
  const hookScore = Math.round(MOCK_HOOK_BASE + Math.random() * MOCK_HOOK_VARIANCE)
  const boredomScore = Math.round(MOCK_BOREDOM_BASE + Math.random() * MOCK_BOREDOM_VARIANCE)
  const emotionScore = Math.round(MOCK_EMOTION_BASE + Math.random() * MOCK_EMOTION_VARIANCE)

  const gradeData = gradeFromScore(overallScore)
  const formatType = resolveFormatType(mockDuration)

  const mockInsights = [
    {
      type: 'HOOK_MOMENT',
      severity: 'HIGH',
      timestampSeconds: Math.round(5 + Math.random() * 10),
      title: 'Strong hook detected',
      description: 'Viewer engagement peaks in the first 15 seconds — your opening lands well.',
      suggestion: 'Replicate this energy in future intros.'
    },
    {
      type: 'BOREDOM_SPIKE',
      severity: 'MEDIUM',
      timestampSeconds: Math.round(30 + Math.random() * 30),
      title: 'Boredom spike',
      description: 'Attention drift detected mid-video — viewers may scroll away at this point.',
      suggestion: 'Add a pattern interrupt: cut to B-roll, add a kinetic text overlay, or ask a direct question.'
    },
    {
      type: 'EMOTION_PEAK',
      severity: 'HIGH',
      timestampSeconds: Math.round(70 + Math.random() * 30),
      title: 'Emotional peak',
      description: 'Strong emotional response detected — this moment resonates deeply with viewers.',
      suggestion: 'Use this style of storytelling more often to maximise retention.'
    }
  ]

  const resultPayload: Prisma.AnalysisResultUncheckedCreateInput = {
    analysisId,
    overallScore,
    hookScore,
    boredomScore,
    emotionScore,
    hookTimeseries: hookTimeseries as unknown as Prisma.InputJsonValue,
    boredomTimeseries: boredomTimeseries as unknown as Prisma.InputJsonValue,
    emotionTimeseries: emotionTimeseries as unknown as Prisma.InputJsonValue,
    rawOutputS3Key: null,
    insights: mockInsights as unknown as Prisma.InputJsonValue,
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

  await prisma.analysis.update({
    where: { id: analysisId },
    data: {
      status: AnalysisStatus.COMPLETED,
      processingCompletedAt: new Date(),
      durationSeconds: analysis.durationSeconds ?? mockDuration,
      errorCode: null,
      errorMessage: null
    }
  })

  await emitProgress(analysisId, { status: AnalysisStatus.COMPLETED, progress: 100, currentStep: 'Completed' })

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
  logger.info({ analysisId }, '[MOCK] Mock ML processing complete')
}

async function processJob(job: Job<AnalysisJob>) {
  if (env.USE_MOCK_ML) {
    return mockProcessJob(job)
  }

  const { analysisId, userId, sourceType } = job.data

  const analysis = await prisma.analysis.findUnique({ where: { id: analysisId }, include: { user: true } })

  if (!analysis) {
    throw new Error('Analysis not found')
  }

  let s3Key = analysis.s3Key

  if (sourceType === SourceType.YOUTUBE_URL) {
    if (!analysis.youtubeUrl) {
      throw new Error('Missing YouTube URL for analysis')
    }

    await updateStatus(analysisId, AnalysisStatus.DOWNLOADING, 0, 'Downloading YouTube source...')
    const downloaded = await youtubeService.downloadToTemp(analysisId, analysis.youtubeUrl)

    try {
      const planLimit = planLimits[analysis.user.plan]
      if (downloaded.durationSeconds && downloaded.durationSeconds > planLimit.maxDurationSeconds) {
        const err = new Error('Video duration exceeds plan limit')
        ;(err as Error & { code?: string }).code = 'VIDEO_TOO_LONG_FOR_PLAN'
        throw err
      }

      const videoBuffer = await readFile(downloaded.filePath)
      const filenameStem = sanitizeFileStem(downloaded.title ?? downloaded.videoId ?? analysis.youtubeVideoId ?? analysisId)

      s3Key = await storageService.uploadVideo({
        analysisId,
        originalFilename: `${filenameStem}.mp4`,
        contentType: 'video/mp4',
        buffer: videoBuffer
      })

      await prisma.analysis.update({
        where: { id: analysisId },
        data: {
          s3Key,
          sourceType: SourceType.YOUTUBE_URL,
          youtubeVideoId: downloaded.videoId ?? analysis.youtubeVideoId,
          title: analysis.title ?? downloaded.title ?? undefined,
          durationSeconds: downloaded.durationSeconds ?? analysis.durationSeconds,
          fileSizeBytes: downloaded.fileSizeBytes ? BigInt(Math.round(downloaded.fileSizeBytes)) : BigInt(videoBuffer.length),
          mimeType: 'video/mp4',
          videoWidth: downloaded.width,
          videoHeight: downloaded.height,
          fps: downloaded.fps,
          hasAudio: downloaded.hasAudio
        }
      })

      await emitProgress(analysisId, {
        status: AnalysisStatus.DOWNLOADING,
        progress: 10,
        currentStep: 'Download complete'
      })
    } finally {
      await youtubeService.cleanupTempFile(downloaded.filePath)
    }
  }

  if (!s3Key) {
    throw new Error('Missing source video key')
  }

  await updateStatus(analysisId, AnalysisStatus.EXTRACTING_FEATURES, 10, 'Extracting audio and video features...', 240)
  const extract = await mlService.extract({
    analysis_id: analysisId,
    s3_key: s3Key,
    s3_bucket: env.S3_BUCKET_NAME,
    duration_seconds: analysis.durationSeconds ?? undefined,
    content_type: analysis.contentType
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
