import { AnalysisStatus, Plan, SourceType } from '@prisma/client'
import type { Express } from 'express'
import { nanoid } from 'nanoid'
import { StatusCodes } from 'http-status-codes'
import { env } from '../lib/env.js'
import { prisma } from '../lib/prisma.js'
import { redis } from '../lib/redis.js'
import { ApiError } from '../utils/ApiError.js'
import { planLimits } from '../utils/constants.js'
import { serializeAnalysis } from '../utils/serializers.js'
import { storageService } from './storageService.js'
import { analysisQueue } from '../jobs/analysisQueue.js'

const IN_FLIGHT_STATUSES: AnalysisStatus[] = [
  AnalysisStatus.QUEUED,
  AnalysisStatus.DOWNLOADING,
  AnalysisStatus.EXTRACTING_FEATURES,
  AnalysisStatus.RUNNING_TRIBE,
  AnalysisStatus.SCORING,
  AnalysisStatus.GENERATING_INSIGHTS
]

const DELETE_BLOCKED_STATUSES: AnalysisStatus[] = [AnalysisStatus.EXTRACTING_FEATURES, AnalysisStatus.RUNNING_TRIBE]
const RETRYABLE_STATUSES: AnalysisStatus[] = [AnalysisStatus.FAILED, AnalysisStatus.CANCELLED]

function extractYoutubeVideoId(url: string) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match?.[1]) return match[1]
  }

  return null
}

async function enforcePlanLimit(userId: string, plan: Plan) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'USER_NOT_FOUND', 'User not found')
  }

  const now = new Date()
  const monthChanged = now.getMonth() !== user.monthResetAt.getMonth() || now.getFullYear() !== user.monthResetAt.getFullYear()

  let analysesThisMonth = user.analysesThisMonth

  if (monthChanged) {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        analysesThisMonth: 0,
        monthResetAt: now
      }
    })
    analysesThisMonth = updated.analysesThisMonth
  }

  const limit = planLimits[plan].analysesPerMonth
  if (analysesThisMonth >= limit) {
    throw new ApiError(StatusCodes.PAYMENT_REQUIRED, 'PLAN_LIMIT_REACHED', 'You have reached your monthly analysis limit. Upgrade to Pro to continue.')
  }
}

async function enforceQueueDepth(userId: string) {
  const count = await prisma.analysis.count({
    where: {
      userId,
      status: {
        in: IN_FLIGHT_STATUSES
      }
    }
  })

  if (count >= 5) {
    throw new ApiError(StatusCodes.TOO_MANY_REQUESTS, 'QUEUE_DEPTH_LIMIT', 'You already have 5 queued analyses. Please wait for one to finish.')
  }
}

function cacheKey(userId: string, analysisId: string) {
  return `analysis:${userId}:${analysisId}`
}

export const analysisService = {
  async listAnalyses(params: {
    userId: string
    page: number
    limit: number
    status?: AnalysisStatus
    sortBy: 'createdAt' | 'updatedAt'
    sortDir: 'asc' | 'desc'
  }) {
    const skip = (params.page - 1) * params.limit

    const [total, items] = await prisma.$transaction([
      prisma.analysis.count({
        where: {
          userId: params.userId,
          ...(params.status ? { status: params.status } : {})
        }
      }),
      prisma.analysis.findMany({
        where: {
          userId: params.userId,
          ...(params.status ? { status: params.status } : {})
        },
        skip,
        take: params.limit,
        orderBy: {
          [params.sortBy]: params.sortDir
        },
        include: {
          result: {
            select: {
              overallScore: true,
              hookScore: true,
              boredomScore: true,
              emotionScore: true,
              grade: true,
              gradeSummary: true
            }
          }
        }
      })
    ])

    return {
      items: items.map((item) => ({
        id: item.id,
        title: item.title,
        originalFilename: item.originalFilename,
        sourceType: item.sourceType,
        status: item.status,
        createdAt: item.createdAt.toISOString(),
        durationSeconds: item.durationSeconds,
        thumbnailS3Key: item.thumbnailS3Key,
        overallScore: item.result?.overallScore ?? null,
        errorCode: item.errorCode,
        errorMessage: item.errorMessage
      })),
      meta: {
        page: params.page,
        limit: params.limit,
        total
      }
    }
  },

  async createUploadAnalysis(params: {
    userId: string
    file: Express.Multer.File
    userPlan: Plan
    durationSeconds?: number
  }) {
    await enforcePlanLimit(params.userId, params.userPlan)
    await enforceQueueDepth(params.userId)

    const planLimit = planLimits[params.userPlan]

    if (params.file.size > planLimit.maxFileSizeBytes) {
      throw new ApiError(413, 'FILE_TOO_LARGE', 'File is too large for your current plan.')
    }

    if (params.durationSeconds && params.durationSeconds > planLimit.maxDurationSeconds) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'VIDEO_TOO_LONG_FOR_PLAN', 'Video is longer than your plan allows.')
    }

    const analysis = await prisma.analysis.create({
      data: {
        userId: params.userId,
        sourceType: SourceType.FILE,
        status: AnalysisStatus.QUEUED,
        originalFilename: params.file.originalname,
        fileSizeBytes: BigInt(params.file.size),
        mimeType: params.file.mimetype,
        durationSeconds: params.durationSeconds
      }
    })

    const s3Key = await storageService.uploadVideo({
      analysisId: analysis.id,
      originalFilename: params.file.originalname,
      contentType: params.file.mimetype,
      buffer: params.file.buffer
    })

    const job = await analysisQueue.add(
      'analysis',
      {
        analysisId: analysis.id,
        userId: params.userId,
        sourceType: SourceType.FILE,
        s3Key
      },
      {
        removeOnComplete: 100,
        removeOnFail: 100
      }
    )

    await prisma.$transaction([
      prisma.analysis.update({
        where: { id: analysis.id },
        data: {
          s3Key,
          jobId: String(job.id)
        }
      }),
      prisma.user.update({
        where: { id: params.userId },
        data: {
          analysesThisMonth: {
            increment: 1
          }
        }
      })
    ])

    return {
      analysisId: analysis.id,
      status: AnalysisStatus.QUEUED
    }
  },

  async createYoutubeAnalysis(params: { userId: string; url: string; userPlan: Plan }) {
    await enforcePlanLimit(params.userId, params.userPlan)
    await enforceQueueDepth(params.userId)

    const videoId = extractYoutubeVideoId(params.url)

    if (!videoId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'INVALID_YOUTUBE_URL', 'Please provide a valid YouTube URL.')
    }

    const existing = await prisma.analysis.findFirst({
      where: {
        userId: params.userId,
        youtubeVideoId: videoId,
        status: {
          in: IN_FLIGHT_STATUSES
        }
      }
    })

    if (existing) {
      throw new ApiError(StatusCodes.CONFLICT, 'ANALYSIS_ALREADY_PROCESSING', 'This video is already being processed.')
    }

    const analysis = await prisma.analysis.create({
      data: {
        userId: params.userId,
        sourceType: SourceType.YOUTUBE_URL,
        youtubeUrl: params.url,
        youtubeVideoId: videoId,
        status: AnalysisStatus.QUEUED,
        title: `YouTube - ${videoId}`
      }
    })

    const job = await analysisQueue.add(
      'analysis',
      {
        analysisId: analysis.id,
        userId: params.userId,
        sourceType: SourceType.YOUTUBE_URL,
        youtubeUrl: params.url
      },
      {
        removeOnComplete: 100,
        removeOnFail: 100
      }
    )

    await prisma.$transaction([
      prisma.analysis.update({
        where: { id: analysis.id },
        data: {
          jobId: String(job.id)
        }
      }),
      prisma.user.update({
        where: { id: params.userId },
        data: {
          analysesThisMonth: {
            increment: 1
          }
        }
      })
    ])

    return {
      analysisId: analysis.id,
      status: AnalysisStatus.QUEUED
    }
  },

  async getAnalysisById(userId: string, analysisId: string) {
    const key = cacheKey(userId, analysisId)
    const cached = await redis.get(key)
    if (cached) {
      return JSON.parse(cached)
    }

    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
      include: {
        result: true
      }
    })

    if (!analysis) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'ANALYSIS_NOT_FOUND', 'Analysis not found')
    }

    if (analysis.userId !== userId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'FORBIDDEN', 'You do not have access to this analysis')
    }

    const payload = serializeAnalysis(analysis)

    if (analysis.s3Key) {
      payload.playbackUrl = await storageService.getPlaybackUrl(analysis.s3Key)
    }

    await redis.set(key, JSON.stringify(payload), 'EX', 30)

    return payload
  },

  async updateAnalysis(userId: string, analysisId: string, title?: string) {
    const analysis = await prisma.analysis.findUnique({ where: { id: analysisId } })

    if (!analysis) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'ANALYSIS_NOT_FOUND', 'Analysis not found')
    }

    if (analysis.userId !== userId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'FORBIDDEN', 'You do not have access to this analysis')
    }

    const updated = await prisma.analysis.update({
      where: { id: analysisId },
      data: {
        title
      }
    })

    await redis.del(cacheKey(userId, analysisId))

    return serializeAnalysis(updated)
  },

  async deleteAnalysis(userId: string, analysisId: string) {
    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
      include: { result: true }
    })

    if (!analysis) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'ANALYSIS_NOT_FOUND', 'Analysis not found')
    }

    if (analysis.userId !== userId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'FORBIDDEN', 'You do not have access to this analysis')
    }

    if (DELETE_BLOCKED_STATUSES.includes(analysis.status)) {
      throw new ApiError(StatusCodes.CONFLICT, 'ANALYSIS_IN_PROGRESS', 'Cannot delete analysis while heavy processing is running')
    }

    if (analysis.jobId) {
      const job = await analysisQueue.getJob(analysis.jobId)
      if (job) {
        await job.remove().catch(() => null)
      }
    }

    await storageService.deleteKeys([
      analysis.s3Key ?? '',
      analysis.processedS3Key ?? '',
      analysis.thumbnailS3Key ?? '',
      analysis.result?.rawOutputS3Key ?? ''
    ])

    await prisma.analysis.delete({ where: { id: analysisId } })
    await redis.del(cacheKey(userId, analysisId))
    await redis.del(`progress:${analysisId}`)
  },

  async getStatus(userId: string, analysisId: string) {
    const analysis = await prisma.analysis.findUnique({ where: { id: analysisId } })

    if (!analysis) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'ANALYSIS_NOT_FOUND', 'Analysis not found')
    }

    if (analysis.userId !== userId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'FORBIDDEN', 'You do not have access to this analysis')
    }

    const cachedProgress = await redis.get(`progress:${analysisId}`)

    if (cachedProgress) {
      return JSON.parse(cachedProgress)
    }

    return {
      status: analysis.status,
      progress: analysis.status === AnalysisStatus.COMPLETED ? 100 : analysis.status === AnalysisStatus.FAILED ? 0 : 5,
      currentStep: analysis.status
    }
  },

  async exportAnalysis(userId: string, analysisId: string, format: 'pdf' | 'json' | 'csv') {
    const analysis = await prisma.analysis.findUnique({ where: { id: analysisId }, include: { result: true } })

    if (!analysis) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'ANALYSIS_NOT_FOUND', 'Analysis not found')
    }

    if (analysis.userId !== userId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'FORBIDDEN', 'You do not have access to this analysis')
    }

    if (analysis.status !== AnalysisStatus.COMPLETED || !analysis.result) {
      throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, 'ANALYSIS_NOT_READY', 'Analysis is not completed yet')
    }

    if (format !== 'json') {
      throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, 'FORMAT_NOT_SUPPORTED', 'Only JSON export is currently available')
    }

    return {
      filename: `analysis-${analysis.id}.json`,
      mimeType: 'application/json',
      content: JSON.stringify(serializeAnalysis(analysis), null, 2)
    }
  },

  async createShareLink(userId: string, analysisId: string) {
    const analysis = await prisma.analysis.findUnique({ where: { id: analysisId }, include: { result: true } })

    if (!analysis) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'ANALYSIS_NOT_FOUND', 'Analysis not found')
    }

    if (analysis.userId !== userId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'FORBIDDEN', 'You do not have access to this analysis')
    }

    const token = nanoid(24)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    await redis.set(
      `share:${token}`,
      JSON.stringify({ analysisId, expiresAt: expiresAt.toISOString() }),
      'EX',
      7 * 24 * 60 * 60
    )

    return {
      shareUrl: `${env.FRONTEND_URL}/shared/${token}`,
      expiresAt: expiresAt.toISOString()
    }
  },

  async getSharedAnalysis(token: string) {
    const value = await redis.get(`share:${token}`)

    if (!value) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'SHARE_NOT_FOUND', 'Share link is invalid or expired')
    }

    const parsed = JSON.parse(value) as { analysisId: string; expiresAt: string }

    if (new Date(parsed.expiresAt) < new Date()) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'SHARE_EXPIRED', 'Share link has expired')
    }

    const analysis = await prisma.analysis.findUnique({
      where: { id: parsed.analysisId },
      include: { result: true }
    })

    if (!analysis || !analysis.result) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'ANALYSIS_NOT_FOUND', 'Analysis not found')
    }

    const data = serializeAnalysis(analysis)

    return {
      id: data.id,
      title: data.title,
      originalFilename: data.originalFilename,
      status: data.status,
      durationSeconds: data.durationSeconds,
      createdAt: data.createdAt,
      result: data.result
    }
  },

  async usage(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } })

    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'USER_NOT_FOUND', 'User not found')
    }

    const planLimit = planLimits[user.plan]
    return {
      analysesUsed: user.analysesThisMonth,
      analysesLimit: Number.isFinite(planLimit.analysesPerMonth) ? planLimit.analysesPerMonth : -1,
      planResetAt: user.monthResetAt.toISOString(),
      plan: user.plan
    }
  },

  async retryAnalysis(userId: string, analysisId: string) {
    const analysis = await prisma.analysis.findUnique({ where: { id: analysisId } })

    if (!analysis) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'ANALYSIS_NOT_FOUND', 'Analysis not found')
    }

    if (analysis.userId !== userId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'FORBIDDEN', 'You do not have access to this analysis')
    }

    if (!RETRYABLE_STATUSES.includes(analysis.status)) {
      throw new ApiError(StatusCodes.CONFLICT, 'RETRY_NOT_ALLOWED', 'Only failed or cancelled analyses can be retried')
    }

    await enforceQueueDepth(userId)

    const job = await analysisQueue.add(
      'analysis',
      {
        analysisId: analysis.id,
        userId,
        sourceType: analysis.sourceType,
        s3Key: analysis.s3Key ?? undefined,
        youtubeUrl: analysis.youtubeUrl ?? undefined
      },
      { removeOnComplete: 100, removeOnFail: 100 }
    )

    await prisma.analysis.update({
      where: { id: analysisId },
      data: {
        status: AnalysisStatus.QUEUED,
        errorCode: null,
        errorMessage: null,
        jobId: String(job.id),
        processingStartedAt: null,
        processingCompletedAt: null
      }
    })

    return { analysisId, status: AnalysisStatus.QUEUED }
  }
}
