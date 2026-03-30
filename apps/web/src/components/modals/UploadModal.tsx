import { useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { CheckCircle2, CloudUpload, Info, Link2, Lock, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useUploadFile, useUploadYoutube } from '@/hooks/useUpload'
import { queryClient } from '@/lib/queryClient'

interface Props {
  open: boolean
  onClose: () => void
}

const youtubePattern = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/

const MAX_FILE_BYTES = 100 * 1024 * 1024 // 100 MB
const ALLOWED_MIME_TYPES = {
  'video/mp4': ['.mp4'],
  'video/quicktime': ['.mov'],
  'video/webm': ['.webm']
} as const

export function UploadModal({ open, onClose }: Props) {
  const [tab, setTab] = useState<'file' | 'youtube'>('file')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [showPaywall, setShowPaywall] = useState(false)
  const navigate = useNavigate()

  const fileUpload = useUploadFile()
  const youtubeUpload = useUploadYoutube()

  const youtubeValid = useMemo(() => youtubePattern.test(youtubeUrl.trim()), [youtubeUrl])

  const handlePaywallClose = () => {
    setShowPaywall(false)
    onClose()
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ALLOWED_MIME_TYPES,
    maxSize: MAX_FILE_BYTES,
    onDropAccepted(files) {
      setSelectedFile(files[0] ?? null)
    },
    onDropRejected(rejections) {
      const rejection = rejections[0]
      if (!rejection) return
      const isTooLarge = rejection.errors.some((e) => e.code === 'file-too-large')
      const isWrongType = rejection.errors.some((e) => e.code === 'file-invalid-type')
      if (isTooLarge) {
        toast.error(`File exceeds the 100 MB limit (${(rejection.file.size / (1024 * 1024)).toFixed(0)} MB). Please compress or trim your video.`)
      } else if (isWrongType) {
        toast.error(`"${rejection.file.name}" is not supported. Please upload an MP4, MOV, or WebM file.`)
      } else {
        toast.error('This file could not be uploaded. Please try a different file.')
      }
    }
  })

  const handleUploadFile = async () => {
    if (!selectedFile) return

    try {
      const response = await fileUpload.mutateAsync(selectedFile)
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
      } else {
        toast.error('Something went wrong. Please try again.')
      }
    }
  }

  const handleUploadYoutube = async () => {
    if (!youtubeValid) {
      toast.error('Please enter a valid YouTube URL.')
      return
    }

    try {
      const response = await youtubeUpload.mutateAsync(youtubeUrl.trim())
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
          <button
            className="mt-3 text-sm text-slate-500 underline-offset-2 hover:underline"
            onClick={handlePaywallClose}
          >
            Maybe later
          </button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal open={open} onClose={onClose} title="Analyse a video">
      <div className="mb-6 flex border-b border-white/10 text-sm">
        <button className={`pb-3 ${tab === 'file' ? 'border-b-2 border-[var(--primary)] text-white' : 'text-slate-400'}`} onClick={() => setTab('file')}>
          Upload File
        </button>
        <button className={`ml-6 pb-3 ${tab === 'youtube' ? 'border-b-2 border-[var(--primary)] text-white' : 'text-slate-400'}`} onClick={() => setTab('youtube')}>
          YouTube URL
        </button>
      </div>

      {tab === 'file' ? (
        <div className="space-y-4">
          <div
            {...getRootProps()}
            className={`cursor-pointer rounded-2xl border border-dashed p-6 text-center transition ${
              isDragActive ? 'border-[var(--primary)] bg-[var(--primary)]/10' : 'border-white/15 bg-[#08080f] hover:border-white/35'
            }`}
          >
            <input {...getInputProps()} />
            <CloudUpload className="mx-auto mb-3 text-slate-400" />
            <p className="font-semibold">Drop your video here</p>
            <p className="mono mt-1 text-xs text-slate-500">or click to browse · MP4, MOV, WebM · Max 100 MB</p>
          </div>

          {selectedFile ? (
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="truncate text-sm font-semibold">{selectedFile.name}</p>
              <p className="mono mt-1 text-xs text-slate-500">{(selectedFile.size / (1024 * 1024)).toFixed(1)} MB</p>
              <div className="mt-2 flex items-center gap-2 text-sm text-emerald-300">
                <CheckCircle2 size={16} /> Ready to upload
              </div>
            </div>
          ) : null}

          <Button fullWidth onClick={handleUploadFile} disabled={!selectedFile || fileUpload.isPending}>
            {fileUpload.isPending ? 'Starting analysis...' : 'Start analysis'}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <Input
              className="pl-10"
              placeholder="Paste YouTube URL or video ID"
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

          <Button fullWidth onClick={handleUploadYoutube} disabled={!youtubeValid || youtubeUpload.isPending}>
            {youtubeUpload.isPending ? 'Starting analysis...' : 'Analyse this video'}
          </Button>
        </div>
      )}

      <div className="mt-5 rounded-xl border border-[rgba(124,109,250,0.2)] bg-[rgba(124,109,250,0.08)] p-3 text-sm text-violet-200">
        <div className="flex items-start gap-2">
          <Info size={16} className="mt-0.5" />
          <p>Analysis takes 3-8 minutes. You will get real-time progress while processing.</p>
        </div>
      </div>
    </Modal>
  )
}
