import { z } from 'zod';
export const progressUpdateSchema = z.object({
    analysisId: z.string(),
    status: z.string(),
    progress: z.number().min(0).max(100),
    currentStep: z.string(),
    estimatedSecondsRemaining: z.number().optional()
});
