import { useEffect, useRef } from 'react'
import { useAnalysisStore } from '@/stores/analysisStore'
import type { RefObject } from 'react'

export function useVideoSync(videoRef: RefObject<HTMLVideoElement>) {
  const rafRef = useRef<number | null>(null)
  const setCurrentTime = useAnalysisStore((s) => s.setCurrentTime)
  const setDuration = useAnalysisStore((s) => s.setDuration)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const loop = () => {
      setCurrentTime(video.currentTime)
      setDuration(video.duration || 0)
      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [setCurrentTime, setDuration, videoRef])
}
