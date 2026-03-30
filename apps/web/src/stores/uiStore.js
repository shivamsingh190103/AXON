import { create } from 'zustand';
export const useUiStore = create((set) => ({
    uploadModalOpen: false,
    shareModalOpen: false,
    setUploadModalOpen: (uploadModalOpen) => set({ uploadModalOpen }),
    setShareModalOpen: (shareModalOpen) => set({ shareModalOpen })
}));
