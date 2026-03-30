import { create } from 'zustand'
import type { UserProfile } from '@axon/shared'

interface AuthState {
  user: UserProfile | null
  accessToken: string | null
  initializing: boolean
  setAuth: (user: UserProfile, accessToken: string) => void
  setInitializing: (value: boolean) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  initializing: true,
  setAuth: (user, accessToken) => set({ user, accessToken }),
  setInitializing: (initializing) => set({ initializing }),
  clearAuth: () => set({ user: null, accessToken: null })
}))
