import { Loader2 } from 'lucide-react'

export function ProcessingModal({ step, progress }: { step: string; progress: number }) {
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
