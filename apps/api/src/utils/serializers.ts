import type { Analysis, AnalysisResult, User } from '@prisma/client'

export function serializeUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    plan: user.plan,
    analysesThisMonth: user.analysesThisMonth,
    monthResetAt: user.monthResetAt.toISOString(),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null
  }
}

export function serializeAnalysis(analysis: Analysis & { result?: AnalysisResult | null }) {
  return {
    id: analysis.id,
    userId: analysis.userId,
    sourceType: analysis.sourceType,
    title: analysis.title,
    originalFilename: analysis.originalFilename,
    youtubeUrl: analysis.youtubeUrl,
    youtubeVideoId: analysis.youtubeVideoId,
    s3Key: analysis.s3Key,
    processedS3Key: analysis.processedS3Key,
    thumbnailS3Key: analysis.thumbnailS3Key,
    durationSeconds: analysis.durationSeconds,
    fileSizeBytes: analysis.fileSizeBytes?.toString() ?? null,
    mimeType: analysis.mimeType,
    videoWidth: analysis.videoWidth,
    videoHeight: analysis.videoHeight,
    fps: analysis.fps,
    hasAudio: analysis.hasAudio,
    detectedLanguage: analysis.detectedLanguage,
    status: analysis.status,
    jobId: analysis.jobId,
    errorMessage: analysis.errorMessage,
    errorCode: analysis.errorCode,
    processingStartedAt: analysis.processingStartedAt?.toISOString() ?? null,
    processingCompletedAt: analysis.processingCompletedAt?.toISOString() ?? null,
    playbackUrl: null as string | null,
    createdAt: analysis.createdAt.toISOString(),
    updatedAt: analysis.updatedAt.toISOString(),
    result: analysis.result
      ? {
          ...analysis.result,
          createdAt: analysis.result.createdAt.toISOString()
        }
      : null
  }
}
