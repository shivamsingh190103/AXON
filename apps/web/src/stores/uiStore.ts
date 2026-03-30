import { create } from 'zustand'

interface UiState {
  uploadModalOpen: boolean
  shareModalOpen: boolean
  setUploadModalOpen: (value: boolean) => void
  setShareModalOpen: (value: boolean) => void
}

export const useUiStore = create<UiState>((set) => ({
  uploadModalOpen: false,
  shareModalOpen: false,
  setUploadModalOpen: (uploadModalOpen) => set({ uploadModalOpen }),
  setShareModalOpen: (shareModalOpen) => set({ shareModalOpen })
}))
