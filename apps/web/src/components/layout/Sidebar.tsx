import clsx from 'clsx'
import { Activity, LayoutGrid, Settings2, UploadCloud } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useUiStore } from '@/stores/uiStore'
import { Symbol } from '@/lib/symbol'

const navItems = [
  { key: 'dashboard', to: '/dashboard', icon: LayoutGrid, label: 'Dashboard' },
  { key: 'analyses', to: '/dashboard#recent-analyses', icon: Activity, label: 'Analyses' },
  { key: 'settings', to: '/settings', icon: Settings2, label: 'Settings' }
] as const

function sidebarItemClass(active: boolean) {
  return clsx(
    'focus-ring group relative mb-2 flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition',
    active ? 'bg-[rgba(124,109,250,0.12)] text-[var(--primary)]' : 'hover:bg-[#141424] hover:text-slate-200'
  )
}

function Tooltip({ label }: { label: string }) {
  return (
    <span className="pointer-events-none absolute left-12 top-1/2 z-20 hidden -translate-y-1/2 rounded-md border border-white/10 bg-[#1c1c2e] px-2 py-1 text-[11px] text-slate-100 opacity-0 shadow-lg transition group-hover:block group-hover:opacity-100">
      {label}
    </span>
  )
}

export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const setUploadModalOpen = useUiStore((s) => s.setUploadModalOpen)

  const isDashboardActive = location.pathname === '/dashboard' && location.hash !== '#recent-analyses'
  const isAnalysesActive = location.pathname.startsWith('/analysis') || location.hash === '#recent-analyses'
  const isSettingsActive = location.pathname === '/settings'

  return (
    <aside className="hidden w-[60px] shrink-0 border-r border-white/5 bg-[#08080f] md:flex md:flex-col md:items-center md:py-4">
      <Link to={navItems[0].to} aria-label={navItems[0].label} className={sidebarItemClass(isDashboardActive)}>
        <Symbol icon={navItems[0].icon} size={18} />
        {isDashboardActive ? <span className="absolute -left-[11px] h-5 w-[3px] rounded-r bg-[var(--primary)]" /> : null}
        <Tooltip label={navItems[0].label} />
      </Link>

      <Link to={navItems[1].to} aria-label={navItems[1].label} className={sidebarItemClass(isAnalysesActive)}>
        <Symbol icon={navItems[1].icon} size={18} />
        {isAnalysesActive ? <span className="absolute -left-[11px] h-5 w-[3px] rounded-r bg-[var(--primary)]" /> : null}
        <Tooltip label={navItems[1].label} />
      </Link>

      <button
        className={sidebarItemClass(false)}
        onClick={() => {
          setUploadModalOpen(true)
          navigate('/dashboard')
        }}
        aria-label="Upload"
      >
        <Symbol icon={UploadCloud} size={18} />
        <Tooltip label="Upload" />
      </button>

      <div className="mt-auto">
        <Link to={navItems[2].to} aria-label={navItems[2].label} className={sidebarItemClass(isSettingsActive)}>
          <Symbol icon={navItems[2].icon} size={18} />
          {isSettingsActive ? <span className="absolute -left-[11px] h-5 w-[3px] rounded-r bg-[var(--primary)]" /> : null}
          <Tooltip label={navItems[2].label} />
        </Link>
      </div>
    </aside>
  )
}
