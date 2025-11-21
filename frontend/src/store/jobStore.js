import { create } from 'zustand'

export const useJobStore = create((set) => ({
  jobs: [],
  loading: false,
  error: null,
  scanning: false,
  
  setJobs: (jobs) => set({ jobs }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setScanning: (scanning) => set({ scanning }),
  
  addJob: (job) => set((state) => ({
    jobs: [job, ...state.jobs]
  })),
  
  updateJob: (jobId, updates) => set((state) => ({
    jobs: state.jobs.map((job) =>
      job.id === jobId ? { ...job, ...updates } : job
    )
  })),
  
  clearJobs: () => set({ jobs: [] }),
}))
