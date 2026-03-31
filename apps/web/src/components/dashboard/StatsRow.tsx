import { motion } from 'framer-motion'
import { AlertTriangle, BarChart3, Clapperboard } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { counterVariants, fadeInUp } from '@/lib/animations'
import { Symbol } from '@/lib/symbol'
import { scoreToColor } from '@/utils/scoreToColor'

interface Props {
  totalAnalyses: number
  avgScore: number
  dropPoints: number
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color
}: {
  title: string
  value: string
  subtitle: string
  icon: LucideIcon
  color?: string
}) {
  return (
    <motion.div variants={fadeInUp} className="rounded-2xl border border-white/5 bg-[var(--panel)] p-5 transition hover:-translate-y-0.5 hover:border-white/15 hover:shadow-xl">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.12em] text-slate-400">{title}</p>
        <div className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-300">
          <Symbol icon={icon} size={14} />
        </div>
      </div>
      <motion.p variants={counterVariants} className="display mt-3 text-5xl font-bold" style={{ color: color ?? 'var(--text)' }}>
        {value}
      </motion.p>
      <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
    </motion.div>
  )
}

export function StatsRow({ totalAnalyses, avgScore, dropPoints }: Props) {
  return (
    <motion.div className="grid gap-4 md:grid-cols-3" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
      <StatCard title="Total Analyses" value={`${totalAnalyses}`} subtitle="+4 this week" icon={Clapperboard} color="var(--success)" />
      <StatCard title="Avg Neural Score" value={`${avgScore}`} subtitle="vs last week" icon={BarChart3} color={scoreToColor(avgScore)} />
      <StatCard title="Drop Points Found" value={`${dropPoints}`} subtitle="catch them before publishing" icon={AlertTriangle} color="var(--danger)" />
    </motion.div>
  )
}
