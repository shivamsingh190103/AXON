import { z } from 'zod';
import { nameSchema } from './authSchema.js';
export const updateUserSchema = z.object({
    name: nameSchema.optional(),
    avatarUrl: z.string().url().optional()
});
