import { useEffect, useMemo, useState } from 'react'
import { useMotionValue } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { api } from '@/lib/axios'
import { getSocket } from '@/lib/socket'
import { queryClient } from '@/lib/queryClient'
import { useAnalysis, useAnalysisStatus } from '@/hooks/useAnalysis'
import { useAuthStore } from '@/stores/authStore'
import { Topbar } from '@/components/layout/Topbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { VideoPlayer } from '@/components/analysis/VideoPlayer'
import { TimelineTracks } from '@/components/analysis/TimelineTracks'
import { InsightPanel } from '@/components/analysis/InsightPanel'
import { ProcessingModal } from '@/components/modals/ProcessingModal'
import { ShareModal } from '@/components/modals/ShareModal'
import { useUiStore } from '@/stores/uiStore'

export function AnalysisPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const accessToken = useAuthStore((s) => s.accessToken)
  const shareModalOpen = useUiStore((s) => s.shareModalOpen)
  const setShareModalOpen = useUiStore((s) => s.setShareModalOpen)

  const { data, isLoading, refetch } = useAnalysis(id)
  const detail = data?.data
  const statusQuery = useAnalysisStatus(id, detail?.status !== 'COMPLETED')
  const currentTimeMv = useMotionValue(0)
  const [currentSecond, setCurrentSecond] = useState(0)
  const [duration, setDuration] = useState(0)
  const [shareUrl, setShareUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!id || !accessToken) return

    const socket = getSocket(accessToken)
    socket.emit('subscribe:analysis', { analysisId: id })

    const onCompleted = (event: { analysisId: string }) => {
      if (event.analysisId === id) {
        queryClient.invalidateQueries({ queryKey: ['analysis', id] })
        queryClient.invalidateQueries({ queryKey: ['analyses'] })
        toast.success('Your analysis is ready.')
      }
    }

    const onFailed = (event: { analysisId: string; errorMessage: string }) => {
      if (event.analysisId === id) {
        toast.error(event.errorMessage || 'Analysis failed. Please retry.')
        queryClient.invalidateQueries({ queryKey: ['analysis', id] })
      }
    }

    socket.on('analysis:completed', onCompleted)
    socket.on('analysis:failed', onFailed)

    return () => {
      socket.emit('unsubscribe:analysis', { analysisId: id })
      socket.off('analysis:completed', onCompleted)
      socket.off('analysis:failed', onFailed)
    }
  }, [accessToken, id])

  const result = detail?.result

  const progress = statusQuery.data?.data?.progress ?? 0
  const currentStep = statusQuery.data?.data?.currentStep ?? detail?.status ?? 'QUEUED'

  const insightDots = useMemo(() => {
    const insights = (result?.insights as Array<{ timestampSeconds: number; type: 'BOREDOM_SPIKE' | 'EMOTION_PEAK' | 'HOOK_MOMENT' | 'CRITICAL_DROP' }> | undefined) ?? []
    return insights
  }, [result?.insights])

  const analysisFormat = useMemo(() => {
    const persistedFormat = result?.formatType as 'SHORT_FORM' | 'LONG_FORM' | 'STANDARD' | undefined
    if (persistedFormat) return persistedFormat

    const resolvedDuration = duration || detail?.durationSeconds || 0
    if (resolvedDuration > 0 && resolvedDuration < 180) return 'SHORT_FORM' as const
    if (resolvedDuration > 600) return 'LONG_FORM' as const
    return 'STANDARD' as const
  }, [detail?.durationSeconds, duration, result?.formatType])

  const handleSeek = (time: number) => {
    const safeTime = Math.max(0, time)
    currentTimeMv.set(safeTime)
    setCurrentSecond(Math.floor(safeTime))
    const video = document.querySelector('video')
    if (video) {
      video.currentTime = safeTime
    }
  }

  const handleExport = async () => {
    if (!id) return

    try {
      const response = await api.get(`/analyses/${id}/export?format=json`, { responseType: 'blob' })
      const url = URL.createObjectURL(response.data)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `analysis-${id}.json`
      anchor.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Export failed. Please try again.')
    }
  }

  const handleShare = async () => {
    if (!id) return

    try {
      const response = await api.post(`/analyses/${id}/share`)
      setShareUrl(response.data.data.shareUrl)
      setShareModalOpen(true)
    } catch {
      toast.error('Could not generate share link.')
    }
  }

  const handleDelete = async () => {
    if (!id) return

    if (!window.confirm('Delete this analysis permanently?')) return

    try {
      await api.delete(`/analyses/${id}`)
      toast.success('Analysis deleted')
      navigate('/dashboard')
    } catch {
      toast.error('Could not delete this analysis.')
    }
  }

  if (!isLoading && !detail) {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div>
          <h1 className="display text-4xl font-extrabold">Analysis not found</h1>
          <p className="mt-2 text-slate-400">This analysis may have been deleted or you may not have access to it.</p>
          <button className="focus-ring mt-5 rounded-xl bg-[var(--primary)] px-4 py-2" onClick={() => navigate('/dashboard')}>
            Back to dashboard
          </button>
        </div>
      </div>
    )
  }

  const isProcessing = detail?.status && detail.status !== 'COMPLETED' && detail.status !== 'FAILED'

  return (
    <div className="min-h-screen">
      <Topbar />
      <div className="flex">
        <Sidebar />
        <main className="grid w-full gap-4 p-4 lg:grid-cols-[1fr_320px] lg:p-6">
          <section>
            {isProcessing ? (
              <div className="grid min-h-[520px] place-items-center rounded-2xl border border-white/10 bg-[#0b0b16] p-4">
                <ProcessingModal step={currentStep} progress={progress} />
              </div>
            ) : detail?.status === 'FAILED' ? (
              <div className="grid min-h-[520px] place-items-center rounded-2xl border border-rose-400/30 bg-rose-500/10 p-8 text-center">
                <div>
                  <h2 className="display text-3xl font-bold">Analysis failed</h2>
                  <p className="mt-2 text-rose-100">{detail.errorMessage || 'Something went wrong while processing this video.'}</p>
                  <div className="mt-4 flex justify-center gap-2">
                    <button className="focus-ring rounded-xl bg-white/10 px-4 py-2" onClick={() => refetch()}>
                      Try again
                    </button>
                    <button className="focus-ring rounded-xl bg-[var(--primary)] px-4 py-2" onClick={() => navigate('/dashboard')}>
                      Back to dashboard
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <VideoPlayer src={detail?.playbackUrl ?? null} currentTimeMv={currentTimeMv} onSecondChange={setCurrentSecond} onDurationChange={setDuration} />
                <TimelineTracks
                  hook={(result?.hookTimeseries as number[]) ?? []}
                  boredom={(result?.boredomTimeseries as number[]) ?? []}
                  emotion={(result?.emotionTimeseries as number[]) ?? []}
                  duration={duration}
                  currentTimeMv={currentTimeMv}
                  onSeek={handleSeek}
                  insightDots={insightDots}
                />
              </>
            )}
          </section>

          <section>
            {result ? (
              <InsightPanel
                overallScore={result.overallScore}
                hookScore={result.hookScore}
                boredomScore={result.boredomScore}
                emotionScore={result.emotionScore}
                hookValues={(result.hookTimeseries as number[]) ?? []}
                boredomValues={(result.boredomTimeseries as number[]) ?? []}
                emotionValues={(result.emotionTimeseries as number[]) ?? []}
                currentSecond={currentSecond}
                insights={(result.insights as never[]) ?? []}
                analysisFormat={analysisFormat}
                onSeek={handleSeek}
                onShare={handleShare}
                onExport={handleExport}
                onDelete={handleDelete}
              />
            ) : (
              <div className="liquid-glass rounded-2xl p-4 text-sm text-slate-400">No analysis result available yet.</div>
            )}
          </section>
        </main>
      </div>

      <ShareModal open={shareModalOpen} onClose={() => setShareModalOpen(false)} shareUrl={shareUrl} />
    </div>
  )
}
