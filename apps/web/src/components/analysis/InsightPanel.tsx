import { useMemo } from 'react'
import { AlertTriangle, Bolt, Star } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ScoreRing } from './ScoreRing'
import { formatTime } from '@/utils/formatTime'
import { scoreToColor } from '@/utils/scoreToColor'
import type { Insight } from '@axon/shared'

interface Props {
  overallScore: number
  hookScore: number
  boredomScore: number
  emotionScore: number
  hookValues: number[]
  boredomValues: number[]
  emotionValues: number[]
  currentSecond: number
  insights: Insight[]
  analysisFormat: 'SHORT_FORM' | 'LONG_FORM' | 'STANDARD'
  onSeek: (second: number) => void
  onShare: () => void
  onExport: () => void
  onDelete: () => void
}

function scoreSummary(score: number) {
  if (score >= 80) return 'Strong Retention'
  if (score >= 60) return 'Needs Work'
  if (score >= 40) return 'Risky'
  return 'High Risk'
}

export function InsightPanel({
  overallScore,
  hookScore,
  boredomScore,
  emotionScore,
  hookValues,
  boredomValues,
  emotionValues,
  currentSecond,
  insights,
  analysisFormat,
  onSeek,
  onShare,
  onExport,
  onDelete
}: Props) {
  const hookNow = Math.round(hookValues[currentSecond] ?? hookValues[0] ?? 0)
  const boredomNow = Math.round(boredomValues[currentSecond] ?? boredomValues[0] ?? 0)
  const emotionNow = Math.round(emotionValues[currentSecond] ?? emotionValues[0] ?? 0)

  const peakMoments = useMemo(() => {
    const peakIndex = (values: number[]) => {
      if (values.length === 0) return 0
      let index = 0
      let value = values[0] ?? 0
      for (let i = 1; i < values.length; i += 1) {
        if ((values[i] ?? 0) > value) {
          value = values[i] ?? 0
          index = i
        }
      }
      return index
    }

    return {
      hook: peakIndex(hookValues),
      boredom: peakIndex(boredomValues),
      emotion: peakIndex(emotionValues)
    }
  }, [boredomValues, emotionValues, hookValues])

  const liveCard = useMemo(() => {
    if (boredomNow > 70) {
      return {
        icon: <AlertTriangle size={16} />,
        title: `High Boredom Risk - DMN ${boredomNow}/100`,
        message: analysisFormat === 'SHORT_FORM'
          ? 'Fast pattern interrupt needed for social retention.'
          : analysisFormat === 'LONG_FORM'
            ? 'Viewer fatigue detected. Add a visual break or pacing reset.'
            : 'Add a visual or narrative interruption to recover attention.',
        tone: 'bg-rose-500/15 text-rose-300 border-rose-500/35'
      }
    }

    if (emotionNow > 80) {
      return {
        icon: <Star size={16} />,
        title: `Emotional Peak - TPJ ${emotionNow}/100`,
        message: analysisFormat === 'SHORT_FORM'
          ? 'Clip this as a viral moment for Shorts/Reels.'
          : analysisFormat === 'LONG_FORM'
            ? 'Highlight this beat in chaptering and promotion.'
            : 'Strong emotional beat worth surfacing in teasers.',
        tone: 'bg-amber-500/15 text-amber-300 border-amber-500/35'
      }
    }

    if (hookNow > 80) {
      return {
        icon: <Bolt size={16} />,
        title: `Strong Hook - Visual+Audio ${hookNow}/100`,
        message: analysisFormat === 'SHORT_FORM'
          ? 'This opening pattern is short-form ready.'
          : analysisFormat === 'LONG_FORM'
            ? 'Use this energy as an act opener.'
            : 'Strong stimulus blend; consider moving it earlier.',
        tone: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/35'
      }
    }

    return null
  }, [analysisFormat, boredomNow, emotionNow, hookNow])

  const formatBadgeLabel =
    analysisFormat === 'SHORT_FORM'
      ? 'Short-Form Analysis'
      : analysisFormat === 'LONG_FORM'
        ? 'Long-Form Analysis'
        : 'Standard Analysis'

  return (
    <aside className="space-y-3 overflow-y-auto">
      <section className="liquid-glass rounded-2xl p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="display text-lg font-bold">Neural Score</h3>
          <div className="flex items-center gap-2">
            <Badge color="default">{formatBadgeLabel}</Badge>
            <Badge color="default">Overall</Badge>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <ScoreRing score={overallScore} />
          <div className="text-right">
            <Badge color={overallScore > 70 ? 'green' : overallScore > 40 ? 'amber' : 'red'}>{scoreSummary(overallScore)}</Badge>
            <p className="mt-2 text-xs text-slate-400" style={{ color: scoreToColor(overallScore) }}>
              Higher score means better biological retention prediction.
            </p>
          </div>
        </div>
      </section>

      <section className="liquid-glass rounded-2xl p-4">
        <p className="mb-2 text-xs uppercase tracking-[0.12em] text-slate-400">Metrics</p>
        <div className="space-y-2">
          {[
            { label: 'Sensory Hook', value: hookScore, color: 'bg-cyan-400', seekTo: peakMoments.hook },
            { label: 'Boredom Risk', value: boredomScore, color: 'bg-rose-400', seekTo: peakMoments.boredom },
            { label: 'Emotional Impact', value: emotionScore, color: 'bg-amber-400', seekTo: peakMoments.emotion }
          ].map((metric) => (
            <button key={metric.label} className="focus-ring flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-white/5" onClick={() => onSeek(metric.seekTo)}>
              <span className={`size-2 rounded-full ${metric.color}`} />
              <span className="text-sm text-slate-300">{metric.label}</span>
              <div className="mx-2 h-1 flex-1 rounded bg-white/10">
                <div className={`h-full rounded ${metric.color}`} style={{ width: `${metric.value}%` }} />
              </div>
              <span className="mono text-xs text-slate-300">{metric.value}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="liquid-glass rounded-2xl p-4">
        <h4 className="display text-lg font-bold">At {formatTime(currentSecond)}</h4>
        <div className="mt-2 space-y-1 text-sm text-slate-300">
          <p>Hook: {hookNow}</p>
          <p>Boredom: {boredomNow}</p>
          <p>Emotion: {emotionNow}</p>
        </div>

        {liveCard ? (
          <div className={`mt-3 rounded-xl border p-3 text-sm ${liveCard.tone}`}>
            <div className="flex items-center gap-2">{liveCard.icon}</div>
            <p className="mt-1">{liveCard.title}</p>
            <p className="mt-1 text-xs opacity-90">{liveCard.message}</p>
          </div>
        ) : null}
      </section>

      <section className="liquid-glass rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="display text-lg font-bold">All Insights</h4>
          <Badge color="default">{insights.length}</Badge>
        </div>

        <div className="space-y-2">
          {insights.length === 0 ? <p className="text-sm text-slate-400">No critical issues found. This video scores well across all metrics.</p> : null}
          {insights.map((insight, index) => (
            <button
              key={`${insight.type}-${insight.timestampSeconds}-${index}`}
              className="focus-ring w-full rounded-xl border border-white/10 bg-black/20 p-3 text-left text-sm transition hover:bg-white/5"
              onClick={() => onSeek(insight.timestampSeconds)}
            >
              <div className="mb-1 flex items-center justify-between">
                <Badge color={insight.type === 'BOREDOM_SPIKE' ? 'red' : insight.type === 'EMOTION_PEAK' ? 'amber' : 'cyan'}>{insight.type.replaceAll('_', ' ')}</Badge>
                <span className="mono text-xs text-slate-500">{formatTime(insight.timestampSeconds)}</span>
              </div>
              <p>{insight.description}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="liquid-glass rounded-2xl p-4">
        <div className="space-y-2">
          <Button fullWidth onClick={onExport}>Export as JSON</Button>
          <Button fullWidth variant="secondary" onClick={onShare}>Share report</Button>
          <Button fullWidth variant="ghost" onClick={() => (window.location.href = '/dashboard')}>Analyse another video</Button>
          <button className="focus-ring w-full text-center text-xs text-rose-300" onClick={onDelete}>Delete this analysis</button>
        </div>
      </section>
    </aside>
  )
}
