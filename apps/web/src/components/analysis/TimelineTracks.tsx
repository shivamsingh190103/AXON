import { useMemo } from 'react'
import { clamp } from '@/utils/clamp'
import { formatTime } from '@/utils/formatTime'

interface TrackProps {
  label: string
  color: string
  values: number[]
}

interface Props {
  hook: number[]
  boredom: number[]
  emotion: number[]
  duration: number
  currentTime: number
  onSeek: (time: number) => void
  insightDots: Array<{ timestampSeconds: number; type: 'BOREDOM_SPIKE' | 'EMOTION_PEAK' | 'HOOK_MOMENT' | 'CRITICAL_DROP' }>
}

function gradientFromValues(values: number[], color: string) {
  if (values.length === 0) return '#141424'
  const step = Math.max(1, Math.floor(values.length / 80))
  const stops: string[] = []

  for (let i = 0; i < values.length; i += step) {
    const pct = (i / (values.length - 1)) * 100
    const alpha = clamp(values[i] / 100, 0.2, 1)
    stops.push(`rgba(${color}, ${alpha}) ${pct.toFixed(2)}%`)
  }

  return `linear-gradient(90deg, ${stops.join(',')})`
}

function Track({ label, color, values }: TrackProps) {
  const gradient = useMemo(() => gradientFromValues(values, color), [values, color])

  return (
    <div className="grid grid-cols-[52px_1fr] items-center gap-2">
      <span className="mono text-right text-[9px] uppercase tracking-[0.12em]" style={{ color: `rgb(${color})` }}>
        {label}
      </span>
      <div className="h-4 overflow-hidden rounded bg-[#141424]">
        <div className="h-full" style={{ background: gradient }} />
      </div>
    </div>
  )
}

function dotColor(type: string) {
  if (type === 'BOREDOM_SPIKE' || type === 'CRITICAL_DROP') return 'bg-rose-400'
  if (type === 'EMOTION_PEAK') return 'bg-amber-400'
  return 'bg-cyan-400'
}

export function TimelineTracks({ hook, boredom, emotion, duration, currentTime, onSeek, insightDots }: Props) {
  const playheadPct = duration > 0 ? (currentTime / duration) * 100 : 0

  const seekFromEvent = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const pct = clamp((event.clientX - rect.left) / rect.width, 0, 1)
    onSeek(pct * duration)
  }

  return (
    <div className="relative mt-3 space-y-2" onClick={seekFromEvent} role="presentation">
      <Track label="HOOK" color="34,211,238" values={hook} />
      <Track label="BOREDOM" color="248,113,113" values={boredom} />
      <Track label="EMOTION" color="251,146,60" values={emotion} />

      <div className="ml-[54px] mt-2 flex h-4 items-center rounded bg-transparent">
        <div className="relative h-full w-full">
          {insightDots.map((insight, index) => {
            const left = duration > 0 ? (insight.timestampSeconds / duration) * 100 : 0
            return (
              <button
                key={`${insight.type}-${insight.timestampSeconds}-${index}`}
                className={`absolute top-1 size-2 -translate-x-1/2 rounded-full ${dotColor(insight.type)} transition hover:scale-150`}
                style={{ left: `${left}%` }}
                title={`${formatTime(insight.timestampSeconds)} - ${insight.type.replaceAll('_', ' ')}`}
                onClick={(event) => {
                  event.stopPropagation()
                  onSeek(insight.timestampSeconds)
                }}
              />
            )
          })}
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-5 top-0 ml-[54px] w-[1px] bg-white/90" style={{ left: `${playheadPct}%` }} />
    </div>
  )
}
