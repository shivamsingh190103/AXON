import { AlertTriangle, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface Props {
  step: string
  progress: number
  failed?: boolean
  errorMessage?: string
  onRetry?: () => void
}

export function ProcessingModal({ step, progress, failed, errorMessage, onRetry }: Props) {
  const navigate = useNavigate()

  if (failed) {
    return (
      <div className="liquid-glass mx-auto max-w-xl rounded-3xl border border-rose-500/30 bg-rose-500/10 p-8 text-center">
        <AlertTriangle className="mx-auto mb-4 text-rose-400" size={36} />
        <h3 className="display text-2xl font-bold text-rose-300">Analysis failed</h3>
        <p className="mt-2 text-rose-200/80">{errorMessage || 'Something went wrong while processing your video.'}</p>
        <div className="mt-6 flex justify-center gap-3">
          {onRetry ? (
            <button
              onClick={onRetry}
              className="focus-ring rounded-xl bg-white/10 px-5 py-2 text-sm font-semibold transition hover:bg-white/20"
            >
              Retry
            </button>
          ) : null}
          <button
            onClick={() => navigate('/dashboard')}
            className="focus-ring rounded-xl bg-[var(--primary)] px-5 py-2 text-sm font-semibold transition hover:opacity-90"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="liquid-glass mx-auto max-w-xl rounded-3xl border border-white/10 p-8 text-center">
      <Loader2 className="mx-auto mb-4 animate-spin text-[var(--primary)]" />
      <h3 className="display text-2xl font-bold">Running neural analysis</h3>
      <p className="mt-2 text-slate-400">TRIBE v2 is processing your video.</p>
      <p className="mono mt-4 text-xs uppercase tracking-[0.14em] text-slate-500">{step}</p>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full bg-[var(--primary)] transition-all" style={{ width: `${progress}%` }} />
      </div>
      <p className="mono mt-2 text-xs text-slate-400">{Math.round(progress)}%</p>
    </div>
  )
}
