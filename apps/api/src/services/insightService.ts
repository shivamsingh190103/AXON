import { InsightSeverity, InsightType, type Insight } from '@axon/shared'

type AnalysisFormat = 'SHORT_FORM' | 'LONG_FORM' | 'STANDARD'

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function getAnalysisFormat(durationSeconds: number): AnalysisFormat {
  if (durationSeconds > 0 && durationSeconds < 180) return 'SHORT_FORM'
  if (durationSeconds > 600) return 'LONG_FORM'
  return 'STANDARD'
}

function generateBoredomDescription(second: number, total: number, severity: InsightSeverity, format: AnalysisFormat) {
  const position = second / total
  if (format === 'SHORT_FORM') {
    return `Short-form hook risk around ${formatTime(second)}. This moment likely loses swipe-speed viewers.`
  }

  if (format === 'LONG_FORM' && position > 0.5) {
    return `Viewer fatigue is rising at ${formatTime(second)}. Narrative momentum is flattening in the long-form arc.`
  }

  if (severity === InsightSeverity.CRITICAL && position < 0.2) {
    return `Critical early drop at ${formatTime(second)}. Viewers are disengaging in the hook window.`
  }

  if (position > 0.8) {
    return `Boredom spike near the ending at ${formatTime(second)}. Strong finish momentum is dropping.`
  }

  return `High default-mode activation at ${formatTime(second)} indicates attention drift.`
}

function generateBoredomSuggestion(second: number, total: number, format: AnalysisFormat): string {
  if (format === 'SHORT_FORM') {
    return 'Fast pattern interrupt needed: cut faster, add kinetic text, and front-load your strongest visual in the next second.'
  }

  if (format === 'LONG_FORM') {
    return 'Introduce a visual break, recap the key idea, or switch scene pacing to reduce cognitive fatigue.'
  }

  const position = second / total
  if (position < 0.15) return 'Add a fast B-roll cut, a text overlay with a bold claim, or directly address the viewer with a question.'
  if (position < 0.4) return 'This is your critical retention zone. Add a pattern interrupt: cut to a reaction shot, zoom in dramatically, or add a graphic overlay.'
  if (position > 0.8) return 'Viewers who made it this far are invested. Add a strong call-to-action or tease the next video to keep them engaged.'
  return 'Add B-roll footage, increase pace with a cut, or add text overlays to re-stimulate visual attention.'
}

function getSeverity(type: InsightType, value: number): InsightSeverity {
  if (type === InsightType.BOREDOM_SPIKE) {
    if (value > 85) return InsightSeverity.CRITICAL
    if (value > 75) return InsightSeverity.HIGH
    if (value > 65) return InsightSeverity.MEDIUM
    return InsightSeverity.LOW
  }

  if (type === InsightType.EMOTION_PEAK) {
    return value > 90 ? InsightSeverity.HIGH : InsightSeverity.MEDIUM
  }

  return InsightSeverity.MEDIUM
}

export function generateInsights(hookTs: number[], boredomTs: number[], emotionTs: number[], durationSeconds: number): Insight[] {
  const insights: Insight[] = []
  const format = getAnalysisFormat(durationSeconds)

  let lastBoredomReport = -999
  for (let i = 2; i < boredomTs.length; i += 1) {
    if (boredomTs[i] > 65 && boredomTs[i - 1] > 55 && boredomTs[i - 2] > 45) {
      if (i - lastBoredomReport > 10) {
        const severity = getSeverity(InsightType.BOREDOM_SPIKE, boredomTs[i])
        insights.push({
          type: InsightType.BOREDOM_SPIKE,
          timestampSeconds: i,
          severity,
          title: severity === InsightSeverity.CRITICAL ? 'Critical Attention Drop' : 'High Boredom Risk',
          description: generateBoredomDescription(i, durationSeconds, severity, format),
          suggestion: generateBoredomSuggestion(i, durationSeconds, format)
        })
        lastBoredomReport = i
      }
    }
  }

  for (let i = 3; i < emotionTs.length - 3; i += 1) {
    const isLocalMax =
      emotionTs[i] > emotionTs[i - 1] &&
      emotionTs[i] > emotionTs[i + 1] &&
      emotionTs[i] > emotionTs[i - 2] &&
      emotionTs[i] > emotionTs[i + 2]

    if (isLocalMax && emotionTs[i] > 75) {
      insights.push({
        type: InsightType.EMOTION_PEAK,
        timestampSeconds: i,
        severity: getSeverity(InsightType.EMOTION_PEAK, emotionTs[i]),
        title: 'Emotional Peak',
        description: `Highest emotional activation at ${formatTime(i)} (TPJ: ${Math.round(emotionTs[i])}/100).`,
        suggestion:
          format === 'SHORT_FORM'
            ? `Clip this 5-second window (${formatTime(Math.max(0, i - 2))} - ${formatTime(i + 3)}) for a viral Shorts/Reels moment.`
            : format === 'LONG_FORM'
              ? 'Use this beat as a chapter highlight and reinforce it with a visual callback to sustain long-form attention.'
              : `Clip this 5-second window (${formatTime(Math.max(0, i - 2))} - ${formatTime(i + 3)}) for a YouTube Short or Instagram Reel.`
      })
    }
  }

  for (let i = 5; i < hookTs.length; i += 1) {
    const prevMin = Math.min(...hookTs.slice(i - 5, i))
    if (prevMin < 40 && hookTs[i] > 75) {
      insights.push({
        type: InsightType.HOOK_MOMENT,
        timestampSeconds: i,
        severity: InsightSeverity.MEDIUM,
        title: 'Hook Recovery Point',
        description: `Strong sensory re-engagement at ${formatTime(i)}.`,
        suggestion:
          format === 'SHORT_FORM'
            ? 'Move this beat into the first 3 seconds to improve swipe retention.'
            : format === 'LONG_FORM'
              ? 'Use this segment as an act transition to recover attention between dense sections.'
              : 'Consider moving this segment earlier so the video hooks harder in the opening.'
      })
    }
  }

  const openingWindowSeconds = format === 'SHORT_FORM' ? 3 : 10
  const openingHook = hookTs.slice(0, Math.min(openingWindowSeconds, hookTs.length))
  const avgOpeningHook = openingHook.length ? openingHook.reduce((a, b) => a + b, 0) / openingHook.length : 0

  if (openingHook.length > 0 && avgOpeningHook < 40) {
    insights.unshift({
      type: InsightType.BOREDOM_SPIKE,
      timestampSeconds: 0,
      severity: InsightSeverity.HIGH,
      title: format === 'SHORT_FORM' ? 'Weak First 3 Seconds' : 'Weak Opening Hook',
      description: `Your first ${Math.round(openingHook.length)} seconds have low sensory engagement (Hook: ${Math.round(avgOpeningHook)}/100).`,
      suggestion:
        format === 'SHORT_FORM'
          ? 'Open instantly with your strongest visual and direct payoff. Remove all setup before second 3.'
          : format === 'LONG_FORM'
            ? 'Start with a high-clarity preview of the value and trim any slow preamble.'
            : 'Start with your most exciting moment or direct question. Cut intro setup by at least 5 seconds.'
    })
  }

  if (format === 'LONG_FORM') {
    for (let i = 19; i < boredomTs.length; i += 1) {
      const window = boredomTs.slice(i - 19, i + 1)
      const avgWindow = window.reduce((acc, value) => acc + value, 0) / window.length
      if (avgWindow > 68) {
        insights.push({
          type: InsightType.CRITICAL_DROP,
          timestampSeconds: i - 10,
          severity: InsightSeverity.HIGH,
          title: 'Viewer Fatigue Window',
          description: `Sustained fatigue detected around ${formatTime(i - 10)} (avg boredom ${Math.round(avgWindow)}/100).`,
          suggestion: 'Insert a visual reset, summary checkpoint, or pace shift to reduce cognitive load in this section.'
        })
        break
      }
    }
  }

  insights.sort((a, b) => a.timestampSeconds - b.timestampSeconds)

  return insights.slice(0, 8)
}

export function gradeFromScore(score: number): { grade: 'A' | 'B' | 'C' | 'D'; summary: string } {
  if (score >= 80) return { grade: 'A', summary: 'Strong Retention' }
  if (score >= 60) return { grade: 'B', summary: 'Solid Performance' }
  if (score >= 40) return { grade: 'C', summary: 'Needs Work' }
  return { grade: 'D', summary: 'High Risk' }
}
