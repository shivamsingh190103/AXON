import { motion } from 'framer-motion'
import { scoreRingVariants } from '@/lib/animations'
import { scoreToColor } from '@/utils/scoreToColor'

interface Props {
  score: number
}

export function ScoreRing({ score }: Props) {
  const color = scoreToColor(score)

  return (
    <div className="relative grid place-items-center">
      <svg width="110" height="110" viewBox="0 0 120 120" aria-label={`Neural score: ${score} out of 100`}>
        <circle cx="60" cy="60" r="46" stroke="#141424" strokeWidth="7" fill="none" />
        <motion.circle
          cx="60"
          cy="60"
          r="46"
          stroke={color}
          strokeWidth="7"
          fill="none"
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          variants={scoreRingVariants(score)}
          initial="hidden"
          animate="visible"
        />
      </svg>
      <div className="absolute text-center">
        <p className="display text-3xl font-extrabold">{score}</p>
        <p className="mono text-[10px] text-slate-400">/100</p>
      </div>
    </div>
  )
}
