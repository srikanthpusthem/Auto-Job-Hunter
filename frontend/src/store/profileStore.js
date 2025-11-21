import { create } from 'zustand'

export const useProfileStore = create((set) => ({
  profile: null,
  loading: false,
  error: null,
  
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  
  updateProfile: (updates) => set((state) => ({
    profile: { ...state.profile, ...updates }
  })),
  
  clearProfile: () => set({ profile: null }),
}))
