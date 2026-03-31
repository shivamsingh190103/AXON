import { motion } from 'framer-motion'
import { AlertTriangle, Clock3, Play, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Symbol } from '@/lib/symbol'
import { formatTime } from '@/utils/formatTime'

interface Props {
  id: string
  title?: string | null
  originalFilename?: string | null
  status: string
  createdAt: string
  durationSeconds?: number | null
  overallScore?: number | null
}

function statusBadge(status: string) {
  if (status === 'COMPLETED') return <Badge color="green">Completed</Badge>
  if (status === 'FAILED') return <Badge color="red">Failed</Badge>
  return <Badge color="primary">{status}</Badge>
}

export function ProjectCard({ id, title, originalFilename, status, createdAt, durationSeconds, overallScore }: Props) {
  const navigate = useNavigate()
  const name = title || originalFilename || 'Untitled analysis'
  const isFailed = status === 'FAILED'
  const isCompleted = status === 'COMPLETED'

  return (
    <motion.button
      className="group liquid-glass focus-ring overflow-hidden rounded-2xl border border-white/8 bg-[var(--panel)] text-left"
      onClick={() => navigate(`/analysis/${id}`)}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="relative h-36 bg-gradient-to-br from-[#1b2244] via-[#14142e] to-[#241438]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_25%,rgba(124,109,250,0.35),transparent_45%)]" />
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
          <span className="mono text-[10px] uppercase tracking-[0.12em] text-slate-300">Neural Map</span>
          {isFailed ? (
            <Symbol icon={AlertTriangle} size={16} className="text-rose-300" />
          ) : isCompleted ? (
            <Symbol icon={Sparkles} size={16} className="text-violet-200" />
          ) : (
            <Symbol icon={Clock3} size={16} className="text-amber-300" />
          )}
        </div>
        <div className="absolute inset-0 grid place-items-center">
          {isFailed ? (
            <div className="rounded-full bg-rose-500/20 p-3 text-rose-300">
              <Symbol icon={AlertTriangle} size={18} />
            </div>
          ) : (
            <div className="rounded-full bg-black/50 p-3 text-white transition group-hover:scale-110 group-hover:bg-[var(--primary)]">
              <Play size={18} fill="currentColor" strokeWidth={1.9} absoluteStrokeWidth />
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2 p-4">
        <p className="truncate text-sm font-semibold text-white" title={name}>
          {name}
        </p>
        <p className="mono text-[11px] text-slate-500">
          {new Date(createdAt).toLocaleDateString()} {durationSeconds ? `· ${formatTime(durationSeconds)}` : ''}
        </p>
        <div className="flex items-center justify-between">
          {statusBadge(status)}
          {typeof overallScore === 'number' ? <Badge color={overallScore > 70 ? 'green' : overallScore > 40 ? 'amber' : 'red'}>{overallScore} / 100</Badge> : null}
        </div>
      </div>
    </motion.button>
  )
}
