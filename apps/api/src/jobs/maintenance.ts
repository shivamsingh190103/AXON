import { AnalysisStatus } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { logger } from '../utils/logger.js'

export async function cleanupStuckAnalyses() {
  const staleCutoff = new Date(Date.now() - 2 * 60 * 60 * 1000)

  const result = await prisma.analysis.updateMany({
    where: {
      status: {
        in: [
          AnalysisStatus.DOWNLOADING,
          AnalysisStatus.EXTRACTING_FEATURES,
          AnalysisStatus.RUNNING_TRIBE,
          AnalysisStatus.SCORING,
          AnalysisStatus.GENERATING_INSIGHTS
        ]
      },
      updatedAt: {
        lt: staleCutoff
      }
    },
    data: {
      status: AnalysisStatus.FAILED,
      errorCode: 'PROCESSING_TIMEOUT',
      errorMessage: 'Processing timed out. Please retry.',
      processingCompletedAt: new Date()
    }
  })

  if (result.count > 0) {
    logger.warn({ count: result.count }, 'Marked stale analyses as failed')
  }
}

export async function resetMonthlyUsageIfNeeded() {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  await prisma.user.updateMany({
    where: {
      monthResetAt: {
        lt: monthStart
      }
    },
    data: {
      analysesThisMonth: 0,
      monthResetAt: monthStart
    }
  })
}

export function startMaintenanceJobs() {
  const hourly = setInterval(() => {
    void cleanupStuckAnalyses().catch((error) => logger.error({ error }, 'cleanupStuckAnalyses failed'))
  }, 60 * 60 * 1000)

  const daily = setInterval(() => {
    void resetMonthlyUsageIfNeeded().catch((error) => logger.error({ error }, 'resetMonthlyUsageIfNeeded failed'))
  }, 24 * 60 * 60 * 1000)

  void cleanupStuckAnalyses().catch((error) => logger.error({ error }, 'cleanupStuckAnalyses failed'))
  void resetMonthlyUsageIfNeeded().catch((error) => logger.error({ error }, 'resetMonthlyUsageIfNeeded failed'))

  return () => {
    clearInterval(hourly)
    clearInterval(daily)
  }
}
