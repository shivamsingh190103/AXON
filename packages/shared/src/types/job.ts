import type { AnalysisStatus, SourceType } from './enums.js'
import type { AnalysisResult } from './analysis.js'

export interface AnalysisJob {
  analysisId: string
  userId: string
  sourceType: SourceType
  s3Key?: string
  youtubeUrl?: string
}

export interface ProgressUpdate {
  status: AnalysisStatus
  progress: number
  currentStep: string
  estimatedSecondsRemaining?: number
}

export interface AnalysisCompletedEvent {
  analysisId: string
  result: Pick<AnalysisResult, 'overallScore' | 'hookScore' | 'boredomScore' | 'emotionScore' | 'grade' | 'gradeSummary'>
}
