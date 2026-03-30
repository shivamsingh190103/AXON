import type { Plan } from './enums.js'

export interface UserProfile {
  id: string
  email: string
  name?: string | null
  avatarUrl?: string | null
  plan: Plan
  analysesThisMonth: number
  monthResetAt: string
  createdAt: string
  updatedAt: string
  lastLoginAt?: string | null
}

export interface AuthPayload {
  user: UserProfile
  accessToken: string
  refreshToken: string
}
