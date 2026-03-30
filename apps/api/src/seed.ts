import bcrypt from 'bcrypt'
import { AnalysisStatus, Grade, Plan, SourceType } from '@prisma/client'
import { prisma } from './lib/prisma.js'

async function main() {
  const passwordHash = await bcrypt.hash('Password123', 12)

  const user = await prisma.user.upsert({
    where: { email: 'demo@axon.ai' },
    create: {
      email: 'demo@axon.ai',
      name: 'Demo Creator',
      passwordHash,
      plan: Plan.FREE,
      analysesThisMonth: 2
    },
    update: {}
  })

  for (let i = 0; i < 2; i += 1) {
    const analysis = await prisma.analysis.create({
      data: {
        userId: user.id,
        sourceType: SourceType.FILE,
        originalFilename: `demo-video-${i + 1}.mp4`,
        status: AnalysisStatus.COMPLETED,
        durationSeconds: 120,
        mimeType: 'video/mp4',
        title: `Demo Analysis ${i + 1}`,
        s3Key: null,
        processingStartedAt: new Date(Date.now() - 10 * 60 * 1000),
        processingCompletedAt: new Date()
      }
    })

    const hookTimeseries = Array.from({ length: 120 }, (_, idx) => 50 + Math.round(30 * Math.sin(idx / 12)))
    const boredomTimeseries = Array.from({ length: 120 }, (_, idx) => 40 + Math.round(20 * Math.cos(idx / 15)))
    const emotionTimeseries = Array.from({ length: 120 }, (_, idx) => 45 + Math.round(25 * Math.sin(idx / 10 + 0.8)))

    await prisma.analysisResult.create({
      data: {
        analysisId: analysis.id,
        overallScore: 78,
        hookScore: 74,
        boredomScore: 33,
        emotionScore: 72,
        hookTimeseries,
        boredomTimeseries,
        emotionTimeseries,
        insights: [
          {
            type: 'EMOTION_PEAK',
            timestampSeconds: 42,
            severity: 'HIGH',
            title: 'Emotional Peak',
            description: 'Emotional activation is highest at 0:42.',
            suggestion: 'Use this segment as your short-form teaser.'
          }
        ],
        grade: Grade.B,
        gradeSummary: 'Strong Retention'
      }
    })
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    // eslint-disable-next-line no-console
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
