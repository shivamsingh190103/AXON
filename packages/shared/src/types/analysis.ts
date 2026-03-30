import type { AnalysisStatus, Grade, InsightSeverity, InsightType, Plan, SourceType } from './enums.js'

export interface Insight {
  type: InsightType
  timestampSeconds: number
  severity: InsightSeverity
  title: string
  description: string
  suggestion: string
}

export interface AnalysisResult {
  id: string
  analysisId: string
  overallScore: number
  hookScore: number
  boredomScore: number
  emotionScore: number
  hookTimeseries: number[]
  boredomTimeseries: number[]
  emotionTimeseries: number[]
  rawOutputS3Key?: string | null
  insights: Insight[]
  grade: Grade
  gradeSummary: string
  createdAt: string
}

export interface AnalysisSummary {
  id: string
  title?: string | null
  originalFilename?: string | null
  sourceType: SourceType
  status: AnalysisStatus
  createdAt: string
  durationSeconds?: number | null
  thumbnailS3Key?: string | null
  overallScore?: number | null
  errorCode?: string | null
  errorMessage?: string | null
}

export interface AnalysisDetail extends AnalysisSummary {
  userId: string
  youtubeUrl?: string | null
  youtubeVideoId?: string | null
  s3Key?: string | null
  processedS3Key?: string | null
  playbackUrl?: string | null
  fileSizeBytes?: string | null
  mimeType?: string | null
  videoWidth?: number | null
  videoHeight?: number | null
  fps?: number | null
  hasAudio?: boolean | null
  detectedLanguage?: string | null
  jobId?: string | null
  processingStartedAt?: string | null
  processingCompletedAt?: string | null
  updatedAt: string
  result?: AnalysisResult | null
}

export interface UsageSummary {
  analysesUsed: number
  analysesLimit: number
  planResetAt: string
  plan: Plan
}
