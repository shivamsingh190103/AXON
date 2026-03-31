import { useEffect, useMemo, useRef, useState } from 'react'
import { type ContentType, AUDIO_ONLY_TYPES } from '@axon/shared'
import { Maximize, Pause, Play, Volume2, VolumeX } from 'lucide-react'
import { motion, useTransform, type MotionValue } from 'framer-motion'
import { clamp } from '@/utils/clamp'
import { formatTime } from '@/utils/formatTime'

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2]
const WAVEFORM_BARS = Array.from({ length: 48 }, (_, index) => index)

interface Props {
  src: string | null
  contentType: ContentType
  portraitMode?: boolean
  currentTimeMv: MotionValue<number>
  onSecondChange: (second: number) => void
  onDurationChange: (duration: number) => void
}

export function VideoPlayer({ src, contentType, portraitMode = false, currentTimeMv, onSecondChange, onDurationChange }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const timeRef = useRef<HTMLSpanElement>(null)
  const secondRef = useRef(0)
  const durationRef = useRef(0)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [speed, setSpeed] = useState(1)
  const [duration, setDuration] = useState(0)
  const isAudioOnly = useMemo(() => AUDIO_ONLY_TYPES.includes(contentType), [contentType])

  const progress = useTransform(currentTimeMv, (time) => {
    if (duration <= 0) return 0
    return clamp((time / duration) * 100, 0, 100)
  })
  const progressWidth = useTransform(progress, (value) => `${value}%`)

  const getMedia = () => (isAudioOnly ? audioRef.current : videoRef.current)

  const renderTime = (time: number, totalDuration: number) => {
    if (!timeRef.current) return
    timeRef.current.textContent = `${formatTime(time)} / ${formatTime(totalDuration)}`
  }

  useEffect(() => {
    const media = getMedia()
    if (!media) return

    let raf = 0
    const loop = () => {
      const time = media.currentTime
      currentTimeMv.set(time)
      renderTime(time, durationRef.current)

      const currentSecond = Math.floor(time)
      if (currentSecond !== secondRef.current) {
        secondRef.current = currentSecond
        onSecondChange(currentSecond)
      }

      raf = requestAnimationFrame(loop)
    }

    const onLoadedMetadata = () => {
      const resolvedDuration = Number.isFinite(media.duration) ? media.duration : 0
      durationRef.current = resolvedDuration
      setDuration(resolvedDuration)
      onDurationChange(resolvedDuration)
      renderTime(media.currentTime, resolvedDuration)
    }
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)

    media.addEventListener('loadedmetadata', onLoadedMetadata)
    media.addEventListener('play', onPlay)
    media.addEventListener('pause', onPause)
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      media.removeEventListener('loadedmetadata', onLoadedMetadata)
      media.removeEventListener('play', onPlay)
      media.removeEventListener('pause', onPause)
    }
  }, [currentTimeMv, isAudioOnly, onDurationChange, onSecondChange, src])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const media = getMedia()
      if (!media) return

      if (event.key === ' ') {
        event.preventDefault()
        if (media.paused) {
          void media.play()
          setPlaying(true)
        } else {
          media.pause()
          setPlaying(false)
        }
      }

      if (event.key === 'ArrowLeft') media.currentTime = Math.max(0, media.currentTime - 5)
      if (event.key === 'ArrowRight') media.currentTime = media.currentTime + 5
      if (event.key.toLowerCase() === 'j') media.currentTime = Math.max(0, media.currentTime - 10)
      if (event.key.toLowerCase() === 'l') media.currentTime = media.currentTime + 10
      if (event.key.toLowerCase() === 'm') {
        media.muted = !media.muted
        setMuted(media.muted)
      }
      if (!isAudioOnly && event.key.toLowerCase() === 'f') {
        void videoRef.current?.requestFullscreen()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isAudioOnly])

  const togglePlay = async () => {
    const media = getMedia()
    if (!media) return

    if (media.paused) {
      await media.play()
      setPlaying(true)
    } else {
      media.pause()
      setPlaying(false)
    }
  }

  const toggleMute = () => {
    const media = getMedia()
    if (!media) return

    media.muted = !media.muted
    setMuted(media.muted)
  }

  const cycleSpeed = () => {
    const media = getMedia()
    if (!media) return

    const index = SPEEDS.indexOf(speed)
    const next = SPEEDS[(index + 1) % SPEEDS.length]
    media.playbackRate = next
    setSpeed(next)
  }

  const seek = (event: React.MouseEvent<HTMLDivElement>) => {
    const media = getMedia()
    if (!media || !duration) return

    const rect = event.currentTarget.getBoundingClientRect()
    const ratio = clamp((event.clientX - rect.left) / rect.width, 0, 1)
    const nextTime = ratio * duration
    media.currentTime = nextTime
    currentTimeMv.set(nextTime)
    onSecondChange(Math.floor(nextTime))
    renderTime(nextTime, duration)
  }

  const changeVolume = (value: number) => {
    const media = getMedia()
    if (!media) return

    media.volume = value
    media.muted = value === 0
    setVolume(value)
    setMuted(media.muted)
  }

  const stageClass = isAudioOnly
    ? 'min-h-[280px] lg:min-h-[360px]'
    : portraitMode
      ? 'aspect-[9/16] min-h-[420px] max-h-[78vh]'
      : 'min-h-[280px] lg:min-h-[440px]'

  return (
    <div>
      <div className={`relative grid place-items-center overflow-hidden rounded-2xl bg-black ${stageClass}`}>
        {src ? (
          isAudioOnly ? (
            <>
              <audio ref={audioRef} src={src} preload="metadata" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(124,109,250,0.45),transparent_55%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,7,20,0.2),rgba(7,7,20,0.85))]" />
              <div className="relative z-10 w-full px-6 pb-8 pt-10">
                <p className="mono text-center text-xs uppercase tracking-[0.18em] text-violet-200">Audio Neural Mode</p>
                <div className="mt-6 flex h-40 items-end gap-1">
                  {WAVEFORM_BARS.map((bar) => (
                    <motion.span
                      key={bar}
                      className="w-full rounded bg-gradient-to-t from-violet-500/30 via-cyan-300/60 to-amber-300/70"
                      animate={{ scaleY: [0.3, 1, 0.45, 0.9, 0.35] }}
                      transition={{
                        duration: 1.8,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: 'reverse',
                        ease: 'easeInOut',
                        delay: bar * 0.02
                      }}
                      style={{ transformOrigin: 'bottom' }}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <video ref={videoRef} src={src} className="max-h-[72vh] w-full object-contain" playsInline />
          )
        ) : (
          <p className="text-slate-500">No playback URL available</p>
        )}

        {!playing ? (
          <button className="focus-ring absolute z-20 grid size-[72px] place-items-center rounded-full bg-[var(--primary)]/85 text-white shadow-[0_0_30px_rgba(124,109,250,0.35)]" onClick={togglePlay}>
            <Play fill="currentColor" />
          </button>
        ) : null}
      </div>

      <div className="mt-3 flex h-[52px] items-center gap-3 rounded-xl border border-white/10 bg-[#0b0b16] px-3">
        <button className="focus-ring grid size-8 place-items-center rounded-full bg-[var(--primary)] text-white" onClick={togglePlay}>
          {playing ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}
        </button>

        <span ref={timeRef} className="mono text-xs text-slate-300">
          {formatTime(0)} / {formatTime(duration)}
        </span>

        <div className="group relative h-2 flex-1 cursor-pointer rounded bg-[#141424]" onClick={seek}>
          <motion.div className="h-full rounded bg-[var(--primary)]" style={{ width: progressWidth }} />
          <motion.div
            className="absolute top-1/2 size-3 -translate-y-1/2 rounded-full border border-white bg-[var(--primary)] opacity-0 transition group-hover:opacity-100"
            style={{ left: progressWidth }}
          />
        </div>

        <button className="focus-ring text-slate-300" onClick={toggleMute}>
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>

        <input type="range" min={0} max={1} step={0.01} value={volume} onChange={(event) => changeVolume(Number(event.target.value))} className="w-16" />

        <button className="focus-ring mono text-xs text-slate-300" onClick={cycleSpeed}>
          {speed}x
        </button>

        {!isAudioOnly ? (
          <button className="focus-ring text-slate-300" onClick={() => videoRef.current?.requestFullscreen()}>
            <Maximize size={15} />
          </button>
        ) : null}
      </div>
    </div>
  )
}

