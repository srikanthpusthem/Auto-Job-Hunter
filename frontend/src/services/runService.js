import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export const runKeys = {
  all: ['runs'],
  status: () => [...runKeys.all, 'status'],
  nextScan: () => [...runKeys.all, 'next-scan'],
  lastScan: () => [...runKeys.all, 'last-scan'],
  timeline: () => [...runKeys.all, 'timeline'],
}

export const useAgentStatus = () => {
  return useQuery({
    queryKey: runKeys.status(),
    queryFn: async () => {
      const { data } = await api.get('/api/runs/status')
      return data
    },
    refetchInterval: 5000, // Poll every 5 seconds
  })
}

export const useNextScan = () => {
  return useQuery({
    queryKey: runKeys.nextScan(),
    queryFn: async () => {
      const { data } = await api.get('/api/runs/next-scan')
      return data
    },
  })
}

export const useLastScan = () => {
  return useQuery({
    queryKey: runKeys.lastScan(),
    queryFn: async () => {
      const { data } = await api.get('/api/runs/last-scan')
      return data
    },
  })
}

export const useAgentTimeline = () => {
  return useQuery({
    queryKey: runKeys.timeline(),
    queryFn: async () => {
      const { data } = await api.get('/api/runs/timeline')
      return data
    },
    refetchInterval: 2000, // Poll every 2 seconds for live updates
  })
}

export const useToggleAutoScan = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ enabled, clerkUserId }) => {
      const { data } = await api.patch('/api/runs/auto-scan', { 
        enabled, 
        clerk_user_id: clerkUserId 
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(runKeys.status())
    },
  })
}

export const useStartRun = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/api/runs/start')
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(runKeys.all)
    },
  })
}

export const useStopRun = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/api/runs/stop')
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(runKeys.all)
    },
  })
}
