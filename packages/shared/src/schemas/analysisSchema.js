import { z } from 'zod';
const cuidSchema = z.string().regex(/^c[a-z0-9]{24}$/i, 'Invalid analysis id');
export const createYoutubeAnalysisSchema = z.object({
    url: z.string().url('Please provide a valid URL')
});
export const updateAnalysisSchema = z.object({
    title: z.string().max(100).optional()
});
export const analysisIdParamSchema = z.object({
    id: cuidSchema
});
export const analysisListQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    status: z.string().optional(),
    sortBy: z.enum(['createdAt', 'updatedAt']).default('createdAt'),
    sortDir: z.enum(['asc', 'desc']).default('desc')
});
export const exportQuerySchema = z.object({
    format: z.enum(['pdf', 'json', 'csv']).default('json')
});
export const shareTokenParamSchema = z.object({
    token: z.string().min(8)
});
