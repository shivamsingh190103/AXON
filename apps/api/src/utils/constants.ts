import { Plan } from '@prisma/client'

export const rateLimits = {
  '/api/v1/analyses/upload': { windowMs: 60 * 1000, max: 5 },
  '/api/v1/analyses/youtube': { windowMs: 60 * 1000, max: 10 },
  '/api/v1/auth/login': { windowMs: 15 * 60 * 1000, max: 10 },
  default: { windowMs: 60 * 1000, max: 100 }
}

export const planLimits: Record<Plan, { analysesPerMonth: number; maxDurationSeconds: number; maxFileSizeBytes: number }> = {
  FREE: { analysesPerMonth: 3, maxDurationSeconds: 600, maxFileSizeBytes: 500 * 1024 * 1024 },
  CREATOR: { analysesPerMonth: 20, maxDurationSeconds: 1800, maxFileSizeBytes: 1024 * 1024 * 1024 },
  PRO: { analysesPerMonth: Number.POSITIVE_INFINITY, maxDurationSeconds: 7200, maxFileSizeBytes: 4 * 1024 * 1024 * 1024 }
}

export const uploadMimeTypes = [
  'video/mp4',
  'video/quicktime',
  'video/x-matroska',
  'video/avi',
  'video/webm'
]
