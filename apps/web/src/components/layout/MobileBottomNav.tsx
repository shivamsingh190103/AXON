import clsx from 'clsx'
import { AudioWaveform, Grid2X2, PlusCircle, Settings } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useUiStore } from '@/stores/uiStore'

export function MobileBottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const setUploadModalOpen = useUiStore((s) => s.setUploadModalOpen)

  const items = [
    { key: 'home', label: 'Home', icon: Grid2X2, to: '/dashboard', active: location.pathname === '/dashboard' && location.hash !== '#recent-analyses' },
    { key: 'analyses', label: 'Analyses', icon: AudioWaveform, to: '/dashboard#recent-analyses', active: location.pathname.startsWith('/analysis') || location.hash === '#recent-analyses' },
    { key: 'settings', label: 'Settings', icon: Settings, to: '/settings', active: location.pathname === '/settings' }
  ]

  const openUpload = () => {
    setUploadModalOpen(true)
    navigate('/dashboard')
  }

  return (
    <nav
      className="liquid-glass fixed inset-x-3 bottom-3 z-40 rounded-2xl px-2 py-2 md:hidden"
      style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}
      aria-label="Mobile navigation"
    >
      <ul className="grid grid-cols-4 items-end gap-1">
        {items.slice(0, 2).map((item) => {
          const Icon = item.icon
          return (
            <li key={item.key}>
              <button
                type="button"
                onClick={() => navigate(item.to)}
                className={clsx(
                  'focus-ring flex w-full flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-medium',
                  item.active ? 'bg-[var(--primary)]/25 text-white' : 'text-slate-300'
                )}
                aria-label={item.label}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            </li>
          )
        })}

        <li>
          <button
            type="button"
            onClick={openUpload}
            className="focus-ring mx-auto flex flex-col items-center gap-1 rounded-xl bg-[var(--primary)]/25 px-2 py-1.5 text-[10px] font-medium text-violet-100"
            aria-label="Upload"
          >
            <PlusCircle size={20} />
            <span>Upload</span>
          </button>
        </li>

        {items.slice(2).map((item) => {
          const Icon = item.icon
          return (
            <li key={item.key}>
              <button
                type="button"
                onClick={() => navigate(item.to)}
                className={clsx(
                  'focus-ring flex w-full flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-medium',
                  item.active ? 'bg-[var(--primary)]/25 text-white' : 'text-slate-300'
                )}
                aria-label={item.label}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
