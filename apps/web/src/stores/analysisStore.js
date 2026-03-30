import { create } from 'zustand';
export const useAnalysisStore = create((set) => ({
    currentTime: 0,
    duration: 0,
    setCurrentTime: (value) => set({ currentTime: value }),
    setDuration: (value) => set({ duration: value })
}));
