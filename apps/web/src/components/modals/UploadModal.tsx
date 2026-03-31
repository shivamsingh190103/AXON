import { useMemo, useState } from 'react'
import { type ContentType, AUDIO_ONLY_TYPES, CONTENT_TYPE_GROUPS, EXPECTED_DURATION, VIDEO_TYPES } from '@axon/shared'
import { isAxiosError } from 'axios'
import {
  BookOpenText,
  CheckCircle2,
  Clapperboard,
  CloudUpload,
  Info,
  Link2,
  Lock,
  Megaphone,
  Mic2,
  Podcast,
  Presentation,
  Radio,
  Smartphone,
  TriangleAlert,
  Tv,
  XCircle,
  Youtube
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useUploadFile, useUploadYoutube } from '@/hooks/useUpload'
import { queryClient } from '@/lib/queryClient'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Symbol } from '@/lib/symbol'

interface Props {
  open: boolean
  onClose: () => void
}

type MediaFamily = 'video' | 'audio'

const youtubePattern = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/
const MAX_VIDEO_BYTES = 500 * 1024 * 1024
const MAX_AUDIO_BYTES = 200 * 1024 * 1024

const ACCEPTED_MEDIA_TYPES = {
  'video/mp4': ['.mp4'],
  'video/quicktime': ['.mov'],
  'video/x-matroska': ['.mkv'],
  'video/x-msvideo': ['.avi'],
  'video/webm': ['.webm'],
  'audio/mpeg': ['.mp3'],
  'audio/wav': ['.wav'],
  'audio/x-wav': ['.wav'],
  'audio/mp4': ['.m4a'],
  'audio/aac': ['.aac'],
  'audio/flac': ['.flac'],
  'audio/ogg': ['.ogg', '.opus'],
  'audio/opus': ['.opus'],
  'audio/webm': ['.webm'],
  'application/ogg': ['.ogg', '.opus']
} as const

const VIDEO_EXTENSIONS = new Set(['.mp4', '.mov', '.mkv', '.avi', '.webm'])
const AUDIO_EXTENSIONS = new Set(['.mp3', '.wav', '.m4a', '.aac', '.flac', '.ogg', '.opus', '.webm'])

function formatDuration(seconds?: number) {
  if (!seconds || !Number.isFinite(seconds)) return 'Unknown'
  const mins = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function formatSeconds(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}m ${secs}s`
}

function extensionOf(filename: string) {
  const index = filename.lastIndexOf('.')
  if (index < 0) return ''
  return filename.slice(index).toLowerCase()
}

function contentTypeFamily(contentType: ContentType): MediaFamily {
  return AUDIO_ONLY_TYPES.includes(contentType) ? 'audio' : 'video'
}

function detectFileFamily(file: File): MediaFamily | 'unknown' {
  const mime = file.type.toLowerCase()
  if (mime.startsWith('audio/')) return 'audio'
  if (mime.startsWith('video/')) return 'video'

  const ext = extensionOf(file.name)
  if (AUDIO_EXTENSIONS.has(ext)) return 'audio'
  if (VIDEO_EXTENSIONS.has(ext)) return 'video'

  return 'unknown'
}

async function readDuration(file: File, family: MediaFamily) {
  const url = URL.createObjectURL(file)
  const media = document.createElement(family)
  media.preload = 'metadata'

  const duration = await new Promise<number | undefined>((resolve) => {
    media.onloadedmetadata = () => {
      const raw = Number.isFinite(media.duration) ? media.duration : undefined
      resolve(raw)
    }
    media.onerror = () => resolve(undefined)
    media.src = url
  })

  URL.revokeObjectURL(url)
  return duration
}

function findContentTypeMeta(contentType: ContentType) {
  for (const group of CONTENT_TYPE_GROUPS) {
    const option = group.options.find((item) => item.type === contentType)
    if (option) {
      return { group: group.label, ...option }
    }
  }

  return null
}

function iconForContentType(contentType: ContentType) {
  switch (contentType) {
    case 'YOUTUBE_VIDEO':
    case 'YOUTUBE_SHORT':
      return Youtube
    case 'INSTAGRAM_REEL':
    case 'TIKTOK_SHORT':
      return Smartphone
    case 'PODCAST_EPISODE':
    case 'PODCAST_CLIP':
      return Podcast
    case 'AUDIO_AD':
      return Mic2
    case 'LIVE_STREAM':
      return Radio
    case 'WEBINAR':
      return Presentation
    case 'COURSE_LESSON':
    case 'LECTURE_RECORDING':
      return BookOpenText
    case 'AD_CREATIVE':
      return Megaphone
    case 'PRODUCT_DEMO':
      return Tv
    default:
      return Clapperboard
  }
}

export function UploadModal({ open, onClose }: Props) {
  const [tab, setTab] = useState<'file' | 'youtube'>('file')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedContentType, setSelectedContentType] = useState<ContentType | null>(null)
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [showPaywall, setShowPaywall] = useState(false)
  const [durationSeconds, setDurationSeconds] = useState<number | undefined>(undefined)
  const [durationWarning, setDurationWarning] = useState<string | null>(null)
  const navigate = useNavigate()

  const fileUpload = useUploadFile()
  const youtubeUpload = useUploadYoutube()
  const youtubeValid = useMemo(() => youtubePattern.test(youtubeUrl.trim()), [youtubeUrl])
  const selectedTypeMeta = selectedContentType ? findContentTypeMeta(selectedContentType) : null
  const maxFileSize = selectedContentType && AUDIO_ONLY_TYPES.includes(selectedContentType) ? MAX_AUDIO_BYTES : MAX_VIDEO_BYTES

  const handlePaywallClose = () => {
    setShowPaywall(false)
    onClose()
  }

  const resetUploadState = () => {
    setSelectedFile(null)
    setDurationSeconds(undefined)
    setDurationWarning(null)
    setYoutubeUrl('')
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ACCEPTED_MEDIA_TYPES,
    maxSize: maxFileSize,
    disabled: !selectedContentType,
    onDropAccepted: async (files) => {
      const file = files[0]
      if (!file || !selectedContentType) return

      const expectedFamily = contentTypeFamily(selectedContentType)
      const actualFamily = detectFileFamily(file)

      if (actualFamily === 'unknown') {
        toast.error('Unsupported media type. Please choose a standard video/audio format.')
        return
      }

      if (actualFamily !== expectedFamily) {
        toast.error(
          expectedFamily === 'audio'
            ? 'This content type expects audio. Please upload an audio file.'
            : 'This content type expects video. Please upload a video file.'
        )
        return
      }

      setSelectedFile(file)

      const parsedDuration = await readDuration(file, expectedFamily)
      setDurationSeconds(parsedDuration)

      if (parsedDuration && selectedContentType) {
        const expected = EXPECTED_DURATION[selectedContentType]
        if (parsedDuration < expected.minSeconds || parsedDuration > expected.maxSeconds) {
          setDurationWarning(
            `This duration is unusual for ${selectedTypeMeta?.title ?? 'this content type'} (${formatSeconds(expected.minSeconds)} to ${formatSeconds(expected.maxSeconds)} expected).`
          )
        } else {
          setDurationWarning(null)
        }
      }
    },
    onDropRejected: (rejections) => {
      const rejection = rejections[0]
      if (!rejection) return
      const tooLarge = rejection.errors.some((error) => error.code === 'file-too-large')
      const wrongType = rejection.errors.some((error) => error.code === 'file-invalid-type')

      if (tooLarge) {
        toast.error(`File too large for this type. Max ${(maxFileSize / (1024 * 1024)).toFixed(0)} MB.`)
        return
      }

      if (wrongType) {
        toast.error('Unsupported format. Use MP4/MOV/MKV/AVI/WebM for video or MP3/WAV/M4A/OPUS for audio.')
        return
      }

      toast.error('Could not process this file. Please try another file.')
    }
  })

  const handleUploadFile = async () => {
    if (!selectedFile || !selectedContentType) {
      toast.error('Select a content type and file first.')
      return
    }

    try {
      const response = await fileUpload.mutateAsync({
        file: selectedFile,
        contentType: selectedContentType,
        durationSeconds
      })
      const analysisId = response?.data?.analysisId
      if (analysisId) {
        queryClient.invalidateQueries({ queryKey: ['analyses'] })
        toast.success('Analysis queued successfully.')
        onClose()
        navigate(`/analysis/${analysisId}`)
      }
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 402) {
        setShowPaywall(true)
      } else if (isAxiosError(err) && err.response?.data?.error?.message) {
        toast.error(err.response.data.error.message as string)
      } else {
        toast.error('Something went wrong. Please try again.')
      }
    }
  }

  const handleUploadYoutube = async () => {
    if (!selectedContentType) {
      toast.error('Choose a content type first.')
      return
    }

    if (AUDIO_ONLY_TYPES.includes(selectedContentType)) {
      toast.error('YouTube import supports video-first content types only.')
      return
    }

    if (!youtubeValid) {
      toast.error('Please enter a valid YouTube URL.')
      return
    }

    try {
      const response = await youtubeUpload.mutateAsync({ url: youtubeUrl.trim(), contentType: selectedContentType })
      const analysisId = response?.data?.analysisId
      if (analysisId) {
        queryClient.invalidateQueries({ queryKey: ['analyses'] })
        toast.success('Analysis queued successfully.')
        onClose()
        navigate(`/analysis/${analysisId}`)
      }
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 402) {
        setShowPaywall(true)
      } else if (isAxiosError(err) && err.response?.data?.error?.message) {
        toast.error(err.response.data.error.message as string)
      } else {
        toast.error('Something went wrong. Please try again.')
      }
    }
  }

  if (showPaywall) {
    return (
      <Modal open={open} onClose={handlePaywallClose} title="Upgrade to Pro">
        <div className="flex flex-col items-center py-6 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-[var(--primary)]/20 text-violet-300">
            <Lock size={28} />
          </div>
          <h3 className="display text-xl font-bold">You've hit your free limit</h3>
          <p className="mt-2 max-w-xs text-sm text-slate-400">
            Free accounts can analyse <span className="font-semibold text-white">3 videos per month</span>. Upgrade to Pro for unlimited analyses, longer videos, and priority GPU processing.
          </p>
          <div className="mt-6 w-full space-y-3 rounded-2xl border border-[rgba(124,109,250,0.25)] bg-[rgba(124,109,250,0.08)] p-4 text-left text-sm">
            <div className="flex items-center gap-2 text-violet-200">
              <CheckCircle2 size={16} className="shrink-0 text-violet-400" />
              Unlimited video analyses
            </div>
            <div className="flex items-center gap-2 text-violet-200">
              <CheckCircle2 size={16} className="shrink-0 text-violet-400" />
              Videos up to 2 hours long
            </div>
            <div className="flex items-center gap-2 text-violet-200">
              <CheckCircle2 size={16} className="shrink-0 text-violet-400" />
              Priority GPU queue
            </div>
          </div>
          <Button fullWidth className="mt-6" onClick={() => navigate('/billing')}>
            Upgrade to Pro
          </Button>
          <button className="mt-3 text-sm text-slate-500 underline-offset-2 hover:underline" onClick={handlePaywallClose}>
            Maybe later
          </button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal open={open} onClose={onClose} title="Analyse media">
      <div className="space-y-5">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <p className="mono text-xs uppercase tracking-[0.12em] text-slate-400">Step 1 · Select content type</p>
            {selectedTypeMeta ? <span className="text-xs text-violet-200">{selectedTypeMeta.title}</span> : null}
          </div>
          <div className="max-h-[220px] space-y-3 overflow-y-auto pr-1">
            {CONTENT_TYPE_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{group.label}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {group.options.map((option) => {
                    const active = selectedContentType === option.type
                    const Icon = iconForContentType(option.type)
                    return (
                      <button
                        key={option.type}
                        className={`focus-ring rounded-xl border bg-[#0b0b16] p-3 text-left transition hover:scale-[1.02] ${
                          active
                            ? 'ring-2 ring-[var(--primary)] border-[var(--primary)] bg-[var(--primary)]/10'
                            : 'border-white/10 hover:border-white/30'
                        }`}
                        onClick={() => {
                          setSelectedContentType(option.type)
                          resetUploadState()
                        }}
                        type="button"
                      >
                        <div className="mb-1 inline-flex size-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-200">
                          <Symbol icon={Icon} size={14} />
                        </div>
                        <p className="text-sm font-semibold text-white">{option.title}</p>
                        <p className="mt-1 text-xs text-slate-400">{option.subtitle}</p>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-4 flex border-b border-white/10 text-sm">
            <button className={`pb-3 ${tab === 'file' ? 'border-b-2 border-[var(--primary)] text-white' : 'text-slate-400'}`} onClick={() => setTab('file')} type="button">
              Upload File
            </button>
            <button className={`ml-6 pb-3 ${tab === 'youtube' ? 'border-b-2 border-[var(--primary)] text-white' : 'text-slate-400'}`} onClick={() => setTab('youtube')} type="button">
              YouTube URL
            </button>
          </div>

          {!selectedContentType ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-400">
              Choose a content type to unlock upload inputs.
            </div>
          ) : null}

          {selectedContentType && tab === 'file' ? (
            <div className="space-y-4">
              <div
                {...getRootProps()}
                className={`cursor-pointer rounded-2xl border border-dashed p-6 text-center transition ${
                  isDragActive ? 'border-[var(--primary)] bg-[var(--primary)]/10' : 'border-white/15 bg-[#08080f] hover:border-white/35'
                }`}
              >
                <input {...getInputProps()} />
                <CloudUpload className="mx-auto mb-3 text-slate-400" />
                <p className="font-semibold">Drop your file here</p>
                <p className="mono mt-1 text-xs text-slate-500">
                  {AUDIO_ONLY_TYPES.includes(selectedContentType) ? 'MP3, WAV, M4A, OPUS' : 'MP4, MOV, MKV, AVI, WebM'} · Max {(maxFileSize / (1024 * 1024)).toFixed(0)} MB
                </p>
              </div>

              {selectedFile ? (
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <p className="truncate text-sm font-semibold">{selectedFile.name}</p>
                  <p className="mono mt-1 text-xs text-slate-500">
                    {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB · {formatDuration(durationSeconds)}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-sm text-emerald-300">
                    <CheckCircle2 size={16} /> Ready to upload
                  </div>
                </div>
              ) : null}

              {durationWarning ? (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/8 p-3 text-sm text-amber-100">
                  <div className="flex items-start gap-2">
                    <TriangleAlert size={16} className="mt-0.5 shrink-0" />
                    <p>{durationWarning} You can still continue.</p>
                  </div>
                </div>
              ) : null}

              <Button fullWidth onClick={handleUploadFile} disabled={!selectedFile || fileUpload.isPending}>
                {fileUpload.isPending ? 'Starting analysis...' : 'Start analysis'}
              </Button>
            </div>
          ) : null}

          {selectedContentType && tab === 'youtube' ? (
            <div className="space-y-4">
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <Input
                  className="pl-10"
                  placeholder="Paste YouTube URL"
                  value={youtubeUrl}
                  onChange={(event) => setYoutubeUrl(event.target.value)}
                  error={youtubeUrl.length > 0 && !youtubeValid ? 'Invalid URL' : undefined}
                  success={youtubeValid}
                />
              </div>

              {youtubeUrl.length > 0 ? (
                <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm">
                  <div className="flex items-center gap-2">
                    {youtubeValid ? <CheckCircle2 size={16} className="text-emerald-300" /> : <XCircle size={16} className="text-rose-300" />}
                    {youtubeValid ? 'Valid YouTube URL' : 'Please use a valid YouTube link'}
                  </div>
                </div>
              ) : null}

              {!VIDEO_TYPES.includes(selectedContentType) ? (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
                  This content type is audio-first. Use file upload for audio inputs.
                </div>
              ) : null}

              <Button fullWidth onClick={handleUploadYoutube} disabled={!youtubeValid || youtubeUpload.isPending || !VIDEO_TYPES.includes(selectedContentType)}>
                {youtubeUpload.isPending ? 'Starting analysis...' : 'Analyse this video'}
              </Button>
            </div>
          ) : null}
        </section>

        <div className="rounded-xl border border-[rgba(124,109,250,0.2)] bg-[rgba(124,109,250,0.08)] p-3 text-sm text-violet-200">
          <div className="flex items-start gap-2">
            <Info size={16} className="mt-0.5 shrink-0" />
            <p>Analysis takes 3–8 minutes. You will receive real-time progress while processing.</p>
          </div>
        </div>
      </div>
    </Modal>
  )
}
