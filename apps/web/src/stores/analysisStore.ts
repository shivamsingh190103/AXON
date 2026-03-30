import { create } from 'zustand'

interface AnalysisState {
  currentTime: number
  duration: number
  setCurrentTime: (value: number) => void
  setDuration: (value: number) => void
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  currentTime: 0,
  duration: 0,
  setCurrentTime: (value) => set({ currentTime: value }),
  setDuration: (value) => set({ duration: value })
}))
