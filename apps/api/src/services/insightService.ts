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

// ---------------------------------------------------------------------------
// Adaptive statistics helpers
// ---------------------------------------------------------------------------

/** Arithmetic mean of an array. */
function mean(arr: number[]): number {
  if (!arr.length) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

/** Population standard deviation. */
function stdDev(arr: number[], mu: number): number {
  if (arr.length < 2) return 0
  const variance = arr.reduce((acc, v) => acc + (v - mu) ** 2, 0) / arr.length
  return Math.sqrt(variance)
}

/**
 * Compute the z-score of a single value relative to a baseline distribution.
 * Returns 0 when the series has near-zero variance to avoid division-by-zero.
 */
function zScore(value: number, mu: number, sigma: number): number {
  if (sigma < 1e-6) return 0
  return (value - mu) / sigma
}

/**
 * Estimate the instantaneous trend (first derivative) using a symmetric
 * finite-difference window of ±radius seconds.  Returns positive when the
 * signal is rising, negative when falling.
 */
function trendAt(ts: number[], i: number, radius = 3): number {
  const lo = Math.max(0, i - radius)
  const hi = Math.min(ts.length - 1, i + radius)
  if (hi === lo) return 0
  return (ts[hi] - ts[lo]) / (hi - lo)
}

/**
 * Rolling mean over a window of `window` samples ending at index `i`.
 */
function rollingMean(ts: number[], i: number, window: number): number {
  const lo = Math.max(0, i - window + 1)
  return mean(ts.slice(lo, i + 1))
}

function generateBoredomDescription(second: number, total: number, severity: InsightSeverity, format: AnalysisFormat, zs: number) {
  const position = second / total
  const zLabel = zs >= 3 ? 'extreme' : zs >= 2 ? 'strong' : 'elevated'
  if (format === 'SHORT_FORM') {
    return `Short-form hook risk around ${formatTime(second)}. ${zLabel.charAt(0).toUpperCase() + zLabel.slice(1)} DMN activation (z=${zs.toFixed(1)}) signals swipe-speed viewer drop-off.`
  }

  if (format === 'LONG_FORM' && position > 0.5) {
    return `Viewer fatigue rising at ${formatTime(second)} (z=${zs.toFixed(1)}). Narrative momentum is flattening in the long-form arc.`
  }

  if (severity === InsightSeverity.CRITICAL && position < 0.2) {
    return `Critical early drop at ${formatTime(second)} (z=${zs.toFixed(1)}). Default-mode activation is unusually high during your hook window.`
  }

  if (position > 0.8) {
    return `Boredom spike near the ending at ${formatTime(second)} (z=${zs.toFixed(1)}). Strong finish momentum is dropping.`
  }

  return `Default-mode activation ${zLabel} at ${formatTime(second)} (z=${zs.toFixed(1)}) indicates attention drift.`
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

/**
 * Map a z-score to an InsightSeverity level.
 * Using z-score thresholds means severity is relative to the video's own
 * signal distribution rather than fixed absolute values.
 */
function getSeverityFromZ(zs: number): InsightSeverity {
  if (zs >= 3.0) return InsightSeverity.CRITICAL
  if (zs >= 2.0) return InsightSeverity.HIGH
  if (zs >= 1.5) return InsightSeverity.MEDIUM
  return InsightSeverity.LOW
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
  const alignedLength = Math.min(hookTs.length, boredomTs.length, emotionTs.length)
  if (alignedLength <= 0) {
    return insights
  }

  const hook = hookTs.slice(0, alignedLength)
  const boredom = boredomTs.slice(0, alignedLength)
  const emotion = emotionTs.slice(0, alignedLength)
  const format = getAnalysisFormat(durationSeconds)

  // Pre-compute global distribution statistics for each signal so that all
  // thresholds are adaptive (relative to this video's own baseline) rather
  // than fixed absolute numbers.
  const boredomMu = mean(boredom)
  const boredomSigma = stdDev(boredom, boredomMu)
  const emotionMu = mean(emotion)
  const emotionSigma = stdDev(emotion, emotionMu)
  const hookMu = mean(hook)
  const hookSigma = stdDev(hook, hookMu)

  // -----------------------------------------------------------------------
  // 1. BOREDOM SPIKE DETECTION
  //    Trigger when the boredom z-score exceeds 1.5 AND the 3-second rolling
  //    mean is also elevated (confirms a sustained rise, not a single frame).
  //    Rate-limit to one report per 10-second window.
  // -----------------------------------------------------------------------
  let lastBoredomReport = -999
  for (let i = 2; i < boredom.length; i += 1) {
    const zs = zScore(boredom[i], boredomMu, boredomSigma)
    const rolling3 = rollingMean(boredom, i, 3)
    const rollingZ = zScore(rolling3, boredomMu, boredomSigma)
    const isTrending = trendAt(boredom, i) > 0

    if (zs >= 1.5 && rollingZ >= 1.0 && isTrending && i - lastBoredomReport > 10) {
      const severity = getSeverityFromZ(zs)
      insights.push({
        type: InsightType.BOREDOM_SPIKE,
        timestampSeconds: i,
        severity,
        title: severity === InsightSeverity.CRITICAL ? 'Critical Attention Drop' : 'High Boredom Risk',
        description: generateBoredomDescription(i, durationSeconds, severity, format, zs),
        suggestion: generateBoredomSuggestion(i, durationSeconds, format)
      })
      lastBoredomReport = i
    }
  }

  // -----------------------------------------------------------------------
  // 2. EMOTION PEAK DETECTION
  //    Local maximum above the video's own 75th-percentile emotion score AND
  //    at least 1.5 standard deviations above the mean.
  // -----------------------------------------------------------------------
  const emotionP75 = emotion.slice().sort((a, b) => a - b)[Math.floor(emotion.length * 0.75)] ?? 75
  for (let i = 3; i < emotion.length - 3; i += 1) {
    const isLocalMax =
      emotion[i] > emotion[i - 1] &&
      emotion[i] > emotion[i + 1] &&
      emotion[i] > emotion[i - 2] &&
      emotion[i] > emotion[i + 2]

    const zs = zScore(emotion[i], emotionMu, emotionSigma)
    if (isLocalMax && zs >= 1.5 && emotion[i] >= emotionP75) {
      insights.push({
        type: InsightType.EMOTION_PEAK,
        timestampSeconds: i,
        severity: zs >= 2.5 ? InsightSeverity.HIGH : InsightSeverity.MEDIUM,
        title: 'Emotional Peak',
        description: `Highest emotional activation at ${formatTime(i)} (TPJ+MTG: ${Math.round(emotion[i])}/100, z=${zs.toFixed(1)}).`,
        suggestion:
          format === 'SHORT_FORM'
            ? `Clip this 5-second window (${formatTime(Math.max(0, i - 2))} - ${formatTime(i + 3)}) for a viral Shorts/Reels moment.`
            : format === 'LONG_FORM'
              ? 'Use this beat as a chapter highlight and reinforce it with a visual callback to sustain long-form attention.'
              : `Clip this 5-second window (${formatTime(Math.max(0, i - 2))} - ${formatTime(i + 3)}) for a YouTube Short or Instagram Reel.`
      })
    }
  }

  // -----------------------------------------------------------------------
  // 3. HOOK RECOVERY POINT
  //    Hook signal rises by ≥1.5 sigma above its recent trough.
  // -----------------------------------------------------------------------
  const hookP25 = hook.slice().sort((a, b) => a - b)[Math.floor(hook.length * 0.25)] ?? 40
  for (let i = 5; i < hook.length; i += 1) {
    const prevMin = Math.min(...hook.slice(i - 5, i))
    const prevMinZ = zScore(prevMin, hookMu, hookSigma)
    const curZ = zScore(hook[i], hookMu, hookSigma)
    if (prevMin <= hookP25 && curZ >= 1.5 && hook[i] - prevMin >= 20) {
      insights.push({
        type: InsightType.HOOK_MOMENT,
        timestampSeconds: i,
        severity: InsightSeverity.MEDIUM,
        title: 'Hook Recovery Point',
        description: `Strong sensory re-engagement at ${formatTime(i)} (Hook: ${Math.round(hook[i])}/100, z=${curZ.toFixed(1)}).`,
        suggestion:
          format === 'SHORT_FORM'
            ? 'Move this beat into the first 3 seconds to improve swipe retention.'
            : format === 'LONG_FORM'
              ? 'Use this segment as an act transition to recover attention between dense sections.'
              : 'Consider moving this segment earlier so the video hooks harder in the opening.'
      })
    }
  }

  // -----------------------------------------------------------------------
  // 4. WEAK OPENING HOOK
  //    Opening window hook average is below the video's own 25th percentile.
  // -----------------------------------------------------------------------
  const openingWindowSeconds = format === 'SHORT_FORM' ? 3 : 10
  const openingHook = hook.slice(0, Math.min(openingWindowSeconds, hook.length))
  const avgOpeningHook = openingHook.length ? mean(openingHook) : 0
  const openingZ = zScore(avgOpeningHook, hookMu, hookSigma)

  if (openingHook.length > 0 && avgOpeningHook <= hookP25 && openingZ <= -0.5) {
    insights.unshift({
      type: InsightType.BOREDOM_SPIKE,
      timestampSeconds: 0,
      severity: InsightSeverity.HIGH,
      title: format === 'SHORT_FORM' ? 'Weak First 3 Seconds' : 'Weak Opening Hook',
      description: `Your first ${Math.round(openingHook.length)} seconds have low sensory engagement (Hook: ${Math.round(avgOpeningHook)}/100, z=${openingZ.toFixed(1)}).`,
      suggestion:
        format === 'SHORT_FORM'
          ? 'Open instantly with your strongest visual and direct payoff. Remove all setup before second 3.'
          : format === 'LONG_FORM'
            ? 'Start with a high-clarity preview of the value and trim any slow preamble.'
            : 'Start with your most exciting moment or direct question. Cut intro setup by at least 5 seconds.'
    })
  }

  // -----------------------------------------------------------------------
  // 5. SUSTAINED FATIGUE WINDOW (long-form only)
  //    A 20-second rolling average of boredom exceeds mu + 1.5 * sigma.
  // -----------------------------------------------------------------------
  if (format === 'LONG_FORM') {
    const fatigueThreshold = boredomMu + 1.5 * boredomSigma
    for (let i = 19; i < boredom.length; i += 1) {
      const windowAvg = rollingMean(boredom, i, 20)
      if (windowAvg > fatigueThreshold) {
        const wZ = zScore(windowAvg, boredomMu, boredomSigma)
        insights.push({
          type: InsightType.CRITICAL_DROP,
          timestampSeconds: i - 10,
          severity: InsightSeverity.HIGH,
          title: 'Viewer Fatigue Window',
          description: `Sustained fatigue around ${formatTime(i - 10)} (20-sec avg boredom ${Math.round(windowAvg)}/100, z=${wZ.toFixed(1)}).`,
          suggestion: 'Insert a visual reset, summary checkpoint, or pace shift to reduce cognitive load in this section.'
        })
        break
      }
    }
  }

  // -----------------------------------------------------------------------
  // 6. CROSS-METRIC DEAD ZONE
  //    Both hook AND emotion are simultaneously below their respective means
  //    for ≥5 consecutive seconds — the most dangerous attention-loss pattern.
  // -----------------------------------------------------------------------
  let deadZoneStart = -1
  const deadZoneLen = Math.min(hook.length, emotion.length, boredom.length)
  for (let i = 0; i < deadZoneLen; i += 1) {
    const hookLow   = hook[i] < hookMu
    const emotLow   = emotion[i] < emotionMu
    const boredHigh = boredom[i] > boredomMu

    if (hookLow && emotLow && boredHigh) {
      if (deadZoneStart < 0) deadZoneStart = i
    } else {
      if (deadZoneStart >= 0 && i - deadZoneStart >= 5) {
        insights.push({
          type: InsightType.CRITICAL_DROP,
          timestampSeconds: deadZoneStart,
          severity: InsightSeverity.HIGH,
          title: 'Attention Dead Zone',
          description: `Hook and emotion both below baseline while boredom is elevated from ${formatTime(deadZoneStart)} to ${formatTime(i - 1)} (${i - deadZoneStart}s).`,
          suggestion:
            format === 'SHORT_FORM'
              ? 'This window is almost certainly a swipe-away moment. Trim it completely.'
              : 'Insert a pattern interrupt: reaction shot, title card, zoom cut, or direct viewer address.'
        })
      }
      deadZoneStart = -1
    }
  }
  // Handle a dead zone that runs all the way to the end of the arrays.
  if (deadZoneStart >= 0 && deadZoneLen - deadZoneStart >= 5) {
    insights.push({
      type: InsightType.CRITICAL_DROP,
      timestampSeconds: deadZoneStart,
      severity: InsightSeverity.HIGH,
      title: 'Attention Dead Zone',
      description: `Hook and emotion both below baseline while boredom is elevated from ${formatTime(deadZoneStart)} to ${formatTime(deadZoneLen - 1)} (${deadZoneLen - deadZoneStart}s).`,
      suggestion:
        format === 'SHORT_FORM'
          ? 'This window is almost certainly a swipe-away moment. Trim it completely.'
          : 'Insert a pattern interrupt: reaction shot, title card, zoom cut, or direct viewer address.'
    })
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
