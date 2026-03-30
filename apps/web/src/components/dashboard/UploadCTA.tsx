import { ArrowRight, UploadCloud } from 'lucide-react'

interface Props {
  onClick: () => void
}

export function UploadCTA({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="liquid-glass-primary focus-ring relative mt-6 flex w-full items-center gap-4 rounded-2xl border border-[rgba(124,109,250,0.25)] p-5 text-left transition hover:-translate-y-0.5 hover:border-[rgba(124,109,250,0.4)] hover:shadow-[0_0_40px_rgba(124,109,250,0.15)]"
    >
      <div className="flex size-11 items-center justify-center rounded-xl bg-[var(--primary)]/20 text-violet-200">
        <UploadCloud size={20} />
      </div>
      <div className="flex-1">
        <p className="display text-base font-bold">Analyse a new video</p>
        <p className="text-sm text-slate-400">Upload a file or paste a YouTube URL to generate a neural engagement report.</p>
      </div>
      <ArrowRight className="text-[var(--primary)]" />
    </button>
  )
}
