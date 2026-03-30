import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { api } from '@/lib/axios'
import { ScoreRing } from '@/components/analysis/ScoreRing'

export function SharedAnalysisPage() {
  const { token } = useParams()

  const { data, isLoading } = useQuery({
    queryKey: ['shared-analysis', token],
    queryFn: async () => {
      const response = await api.get(`/share/${token}`)
      return response.data
    },
    enabled: Boolean(token)
  })

  if (isLoading) {
    return <div className="grid min-h-screen place-items-center text-slate-400">Loading shared report...</div>
  }

  const payload = data?.data
  if (!payload) {
    return <div className="grid min-h-screen place-items-center text-slate-400">Share link is invalid or expired.</div>
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="display text-4xl font-extrabold">AXON Shared Report</h1>
      <p className="mt-2 text-slate-400">{payload.originalFilename ?? payload.title ?? 'Untitled video'}</p>
      <div className="mt-8 grid gap-4 rounded-2xl border border-white/10 bg-[#0b0b16] p-6 md:grid-cols-[160px_1fr]">
        <ScoreRing score={payload.result.overallScore} />
        <div>
          <p className="text-sm text-slate-400">Hook: {payload.result.hookScore}</p>
          <p className="text-sm text-slate-400">Boredom: {payload.result.boredomScore}</p>
          <p className="text-sm text-slate-400">Emotion: {payload.result.emotionScore}</p>
          <p className="mt-2 text-sm text-slate-300">{payload.result.gradeSummary}</p>
        </div>
      </div>
    </div>
  )
}
