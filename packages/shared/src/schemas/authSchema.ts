import { z } from 'zod'

export const emailSchema = z.string().email().max(255)

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')

export const strongPasswordSchema = passwordSchema.regex(/\d/, 'Password must contain at least one number')

export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be at most 50 characters')
  .regex(/^[a-zA-Z\s-]+$/, 'Name may contain only letters, spaces, and hyphens')

export const registerSchema = z.object({
  email: emailSchema,
  password: strongPasswordSchema,
  name: nameSchema
})

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema
})

export const forgotPasswordSchema = z.object({
  email: emailSchema
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: strongPasswordSchema
})

export const refreshSchema = z.object({
  refreshToken: z.string().min(1).optional()
})

export const changePasswordSchema = z.object({
  currentPassword: passwordSchema,
  newPassword: strongPasswordSchema
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
