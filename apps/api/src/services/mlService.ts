import axios from 'axios'
import { env } from '../lib/env.js'

const client = axios.create({
  baseURL: env.ML_SERVICE_URL,
  timeout: 30 * 60 * 1000,
  headers: {
    'x-ml-secret': env.ML_SERVICE_SECRET
  }
})

export interface ExtractResponse {
  features_s3_prefix: string
  duration_seconds: number
  detected_language: string
  transcript: Array<{ word: string; start: number; end: number }>
}

export interface InferResponse {
  raw_output_s3_key: string
  duration_seconds: number
  num_frames: number
}

export interface ScoreResponse {
  hook_timeseries: number[]
  boredom_timeseries: number[]
  emotion_timeseries: number[]
  hook_score: number
  boredom_score: number
  emotion_score: number
  overall_score: number
}

export const mlService = {
  async extract(body: { analysis_id: string; s3_key: string; s3_bucket: string; duration_seconds?: number; content_type?: string }) {
    const { data } = await client.post<ExtractResponse>('/extract', body, { timeout: 20 * 60 * 1000 })
    return data
  },

  async infer(body: { analysis_id: string; features_s3_prefix: string; s3_bucket: string }) {
    const { data } = await client.post<InferResponse>('/infer', body, { timeout: 30 * 60 * 1000 })
    return data
  },

  async score(body: { analysis_id: string; raw_output_s3_key: string; s3_bucket: string }) {
    const { data } = await client.post<ScoreResponse>('/score', body, { timeout: 5 * 60 * 1000 })
    return data
  }
}
