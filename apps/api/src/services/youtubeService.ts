import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

export interface DownloadedYoutubeVideo {
  filePath: string
  title: string | null
  durationSeconds: number | null
  fileSizeBytes: number | null
  width: number | null
  height: number | null
  fps: number | null
  hasAudio: boolean
  videoId: string | null
}

interface YtDlpMetadata {
  id?: string
  title?: string
  duration?: number
}

interface FfprobeStream {
  codec_type?: string
  width?: number
  height?: number
  avg_frame_rate?: string
}

interface FfprobeFormat {
  duration?: string
  size?: string
}

interface FfprobeOutput {
  streams?: FfprobeStream[]
  format?: FfprobeFormat
}

function parseFps(frameRate: string | undefined): number | null {
  if (!frameRate) return null
  if (!frameRate.includes('/')) {
    const direct = Number(frameRate)
    return Number.isFinite(direct) && direct > 0 ? direct : null
  }

  const [numeratorRaw, denominatorRaw] = frameRate.split('/')
  const numerator = Number(numeratorRaw)
  const denominator = Number(denominatorRaw)
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return null
  const fps = numerator / denominator
  return Number.isFinite(fps) && fps > 0 ? fps : null
}

async function readYtDlpMetadata(url: string): Promise<YtDlpMetadata> {
  const { stdout } = await execFileAsync('yt-dlp', ['--dump-single-json', '--no-warnings', '--skip-download', url], {
    maxBuffer: 10 * 1024 * 1024
  })

  const parsed = JSON.parse(stdout) as YtDlpMetadata
  return parsed
}

async function probeVideo(filePath: string): Promise<FfprobeOutput> {
  const { stdout } = await execFileAsync(
    'ffprobe',
    ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', filePath],
    { maxBuffer: 10 * 1024 * 1024 }
  )
  return JSON.parse(stdout) as FfprobeOutput
}

export const youtubeService = {
  async downloadToTemp(analysisId: string, url: string): Promise<DownloadedYoutubeVideo> {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), `axon-ytdlp-${analysisId}-`))
    const outputPath = path.join(tempDir, 'source.mp4')

    try {
      const metadata = await readYtDlpMetadata(url)

      await execFileAsync(
        'yt-dlp',
        [
          '-f',
          'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
          '--merge-output-format',
          'mp4',
          '--no-warnings',
          '--no-progress',
          '-o',
          outputPath,
          url
        ],
        { maxBuffer: 1024 * 1024 }
      )

      const probe = await probeVideo(outputPath)
      const videoStream = (probe.streams ?? []).find((stream) => stream.codec_type === 'video')
      const hasAudio = (probe.streams ?? []).some((stream) => stream.codec_type === 'audio')

      const durationFromProbe = probe.format?.duration ? Number(probe.format.duration) : null
      const sizeFromProbe = probe.format?.size ? Number(probe.format.size) : null

      return {
        filePath: outputPath,
        title: metadata.title ?? null,
        durationSeconds: durationFromProbe && Number.isFinite(durationFromProbe) ? durationFromProbe : metadata.duration ?? null,
        fileSizeBytes: sizeFromProbe && Number.isFinite(sizeFromProbe) ? sizeFromProbe : null,
        width: videoStream?.width ?? null,
        height: videoStream?.height ?? null,
        fps: parseFps(videoStream?.avg_frame_rate),
        hasAudio,
        videoId: metadata.id ?? null
      }
    } catch (error) {
      await rm(tempDir, { recursive: true, force: true }).catch(() => null)
      throw error
    }
  },

  async cleanupTempFile(filePath: string) {
    const dirPath = path.dirname(filePath)
    await rm(dirPath, { recursive: true, force: true }).catch(() => null)
  }
}
