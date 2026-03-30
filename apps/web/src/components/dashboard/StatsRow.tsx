import { motion } from 'framer-motion'
import { counterVariants, fadeInUp } from '@/lib/animations'
import { scoreToColor } from '@/utils/scoreToColor'

interface Props {
  totalAnalyses: number
  avgScore: number
  dropPoints: number
}

function StatCard({ title, value, subtitle, color }: { title: string; value: string; subtitle: string; color?: string }) {
  return (
    <motion.div variants={fadeInUp} className="rounded-2xl border border-white/5 bg-[var(--panel)] p-5 transition hover:-translate-y-0.5 hover:border-white/15 hover:shadow-xl">
      <p className="text-xs uppercase tracking-[0.12em] text-slate-400">{title}</p>
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
      <StatCard title="Total Analyses" value={`${totalAnalyses}`} subtitle="+4 this week" color="var(--success)" />
      <StatCard title="Avg Neural Score" value={`${avgScore}`} subtitle="vs last week" color={scoreToColor(avgScore)} />
      <StatCard title="Drop Points Found" value={`${dropPoints}`} subtitle="catch them before publishing" color="var(--danger)" />
    </motion.div>
  )
}
