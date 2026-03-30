import { create } from 'zustand';
export const useAuthStore = create((set) => ({
    user: null,
    accessToken: null,
    initializing: true,
    setAuth: (user, accessToken) => set({ user, accessToken }),
    setInitializing: (initializing) => set({ initializing }),
    clearAuth: () => set({ user: null, accessToken: null })
}));
