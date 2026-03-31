import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { Topbar } from '@/components/layout/Topbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { useAnalyses } from '@/hooks/useAnalysis'
import { StatsRow } from '@/components/dashboard/StatsRow'
import { UploadCTA } from '@/components/dashboard/UploadCTA'
import { ProjectCard } from '@/components/dashboard/ProjectCard'
import { UploadModal } from '@/components/modals/UploadModal'
import { useUiStore } from '@/stores/uiStore'

function greetingByHour() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const { data, isLoading } = useAnalyses()
  const analyses = data?.data ?? []
  const uploadModalOpen = useUiStore((s) => s.uploadModalOpen)
  const setUploadModalOpen = useUiStore((s) => s.setUploadModalOpen)

  const stats = useMemo(() => {
    const completed = analyses.filter((a: { status: string }) => a.status === 'COMPLETED')
    const avgScore = completed.length
      ? Math.round(completed.reduce((sum: number, item: { overallScore?: number }) => sum + (item.overallScore ?? 0), 0) / completed.length)
      : 0
    const dropPoints = completed.reduce(
      (sum: number, item: { dropPointsFound?: number }) => sum + (item.dropPointsFound ?? 0),
      0
    )

    return {
      total: analyses.length,
      avgScore,
      dropPoints
    }
  }, [analyses])

  return (
    <div className="min-h-screen bg-transparent">
      <Topbar onOpenUpload={() => setUploadModalOpen(true)} />
      <div className="flex">
        <Sidebar />
        <PageWrapper>
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="display text-3xl font-extrabold">
              {greetingByHour()},{' '}
              <span className="text-[var(--primary)]">{user?.name ?? 'Creator'}</span>
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              You have {analyses.length} analyses this week. Your avg Hook Score is {stats.avgScore}%.
            </p>
          </motion.section>

          <div className="mt-6">
            <StatsRow totalAnalyses={stats.total} avgScore={stats.avgScore} dropPoints={stats.dropPoints} />
          </div>

          <UploadCTA onClick={() => setUploadModalOpen(true)} />

          <section id="recent-analyses" className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="display text-sm uppercase tracking-[0.12em] text-slate-300">Recent analyses</h2>
            </div>

            {isLoading ? <p className="text-slate-500">Loading analyses...</p> : null}

            {!isLoading && analyses.length === 0 ? (
              <div className="grid place-items-center rounded-2xl border border-white/10 bg-black/20 p-12 text-center">
                <p className="display text-2xl font-bold">Your analyses will appear here</p>
                <p className="mt-2 text-slate-400">Upload a video to get your first neural engagement report.</p>
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {analyses.map((analysis: any) => (
                <ProjectCard key={analysis.id} {...analysis} />
              ))}
            </div>

            {user?.plan === 'FREE' ? (
              <div className="mt-8 rounded-2xl border border-amber-400/30 bg-amber-500/8 p-4 text-sm text-amber-100">
                You have used {user.analysesThisMonth}/3 free analyses this month. Upgrade for more.
              </div>
            ) : null}
          </section>
        </PageWrapper>
      </div>

      <UploadModal open={uploadModalOpen} onClose={() => setUploadModalOpen(false)} />
      <MobileBottomNav />
    </div>
  )
}
