import { Bell, Search, UploadCloud, UserCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Symbol } from '@/lib/symbol'

interface Props {
  onOpenUpload?: () => void
}

export function Topbar({ onOpenUpload }: Props) {
  const user = useAuthStore((s) => s.user)

  return (
    <header className="liquid-glass sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/10 px-4 md:px-6">
      <div className="flex items-center gap-4">
        <Link to="/dashboard" className="display text-lg font-extrabold tracking-[0.14em] text-white">AXON</Link>
      </div>

      <div className="hidden w-[300px] items-center rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-300 transition focus-within:w-[400px] md:flex">
        <Symbol icon={Search} size={16} className="mr-2 text-slate-500" />
        <input className="w-full bg-transparent outline-none" placeholder="Search analyses..." />
      </div>

      <div className="flex items-center gap-3">
        <button className="focus-ring relative rounded-lg p-2 text-slate-300 hover:bg-white/10" aria-label="Notifications">
          <Symbol icon={Bell} size={18} />
          <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-violet-400" />
        </button>
        <button
          className="focus-ring hidden items-center gap-1 rounded-xl bg-[var(--primary)]/20 px-3 py-2 text-xs text-violet-200 hover:bg-[var(--primary)]/30 md:inline-flex"
          onClick={onOpenUpload}
        >
          <Symbol icon={UploadCloud} size={15} />
          Upload
        </button>
        <Link to="/settings" className="focus-ring flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-bold text-white" aria-label="Open settings">
          {user?.name?.[0]?.toUpperCase() ?? <Symbol icon={UserCircle2} size={16} />}
        </Link>
      </div>
    </header>
  )
}
