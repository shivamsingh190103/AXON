import type { Plan } from '@prisma/client'

declare global {
  namespace Express {
    interface User {
      id: string
      email: string
      name?: string | null
      avatarUrl?: string | null
      passwordHash?: string | null
      googleId?: string | null
      plan: Plan
      analysesThisMonth: number
      monthResetAt: Date | string
      createdAt: Date | string
      updatedAt: Date | string
      lastLoginAt?: Date | string | null
    }

    interface Request {
      user?: User
      userId?: string
    }
  }
}

export {}
