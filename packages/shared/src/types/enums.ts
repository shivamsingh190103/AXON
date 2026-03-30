export enum Plan {
  FREE = 'FREE',
  CREATOR = 'CREATOR',
  PRO = 'PRO'
}

export enum SourceType {
  FILE = 'FILE',
  YOUTUBE_URL = 'YOUTUBE_URL'
}

export enum AnalysisStatus {
  QUEUED = 'QUEUED',
  DOWNLOADING = 'DOWNLOADING',
  EXTRACTING_FEATURES = 'EXTRACTING_FEATURES',
  RUNNING_TRIBE = 'RUNNING_TRIBE',
  SCORING = 'SCORING',
  GENERATING_INSIGHTS = 'GENERATING_INSIGHTS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export enum Grade {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D'
}

export enum InsightType {
  BOREDOM_SPIKE = 'BOREDOM_SPIKE',
  EMOTION_PEAK = 'EMOTION_PEAK',
  HOOK_MOMENT = 'HOOK_MOMENT',
  CRITICAL_DROP = 'CRITICAL_DROP'
}

export enum InsightSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}
