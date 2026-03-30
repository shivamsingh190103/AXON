import { AudioWaveform, FileText, Grid2X2, Lightbulb, Settings } from 'lucide-react'
import clsx from 'clsx'
import { Link, useLocation } from 'react-router-dom'

const items = [
  { to: '/dashboard', icon: Grid2X2, label: 'Dashboard' },
  { to: '/dashboard', icon: AudioWaveform, label: 'All Analyses' },
  { to: '/dashboard', icon: Lightbulb, label: 'Insights' },
  { to: '/dashboard', icon: FileText, label: 'Reports' },
  { to: '/settings', icon: Settings, label: 'Settings' }
]

export function Sidebar() {
  const location = useLocation()

  return (
    <aside className="hidden w-[60px] shrink-0 border-r border-white/5 bg-[#08080f] md:flex md:flex-col md:items-center md:py-4">
      {items.map((item, index) => {
        const active = location.pathname === item.to && index === 0 ? true : location.pathname === item.to && index === items.length - 1
        const Icon = item.icon

        return (
          <Link
            key={`${item.label}-${index}`}
            to={item.to}
            className={clsx(
              'focus-ring group relative mb-2 flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition',
              active ? 'bg-[rgba(124,109,250,0.12)] text-[var(--primary)]' : 'hover:bg-[#141424] hover:text-slate-200'
            )}
            title={item.label}
          >
            <Icon size={18} />
            {active ? <span className="absolute -left-[11px] h-5 w-[3px] rounded-r bg-[var(--primary)]" /> : null}
          </Link>
        )
      })}
    </aside>
  )
}
