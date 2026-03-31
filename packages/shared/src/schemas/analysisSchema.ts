import { z } from 'zod'
import { ContentType } from '../types/enums.js'

const cuidSchema = z.string().regex(/^c[a-z0-9]{24}$/i, 'Invalid analysis id')

export const createYoutubeAnalysisSchema = z.object({
  url: z.string().url('Please provide a valid URL'),
  contentType: z.nativeEnum(ContentType)
})

export const createUploadAnalysisSchema = z.object({
  contentType: z.nativeEnum(ContentType),
  durationSeconds: z.coerce.number().positive().optional()
})

export const updateAnalysisSchema = z.object({
  title: z.string().max(100).optional()
})

export const analysisIdParamSchema = z.object({
  id: cuidSchema
})

export const analysisListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt']).default('createdAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc')
})

export const exportQuerySchema = z.object({
  format: z.enum(['pdf', 'json', 'csv']).default('json')
})

export const shareTokenParamSchema = z.object({
  token: z.string().min(8)
})

export type CreateYoutubeAnalysisInput = z.infer<typeof createYoutubeAnalysisSchema>
export type CreateUploadAnalysisInput = z.infer<typeof createUploadAnalysisSchema>
