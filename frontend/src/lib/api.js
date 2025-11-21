import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// User API
export const userApi = {
  createOrUpdateProfile: async (data) => {
    const response = await api.post('/api/users/profile', data)
    return response.data
  },
  
  getProfile: async (clerkUserId) => {
    const response = await api.get(`/api/users/profile/${clerkUserId}`)
    return response.data
  },
}

// Jobs API
export const jobsApi = {
  triggerScan: async (data) => {
    const response = await api.post('/api/jobs/scan', data)
    return response.data
  },
  
  listJobs: async (clerkUserId, limit = 50) => {
    const response = await api.get('/api/jobs', {
      params: { clerk_user_id: clerkUserId, limit }
    })
    return response.data
  },
  
  getJob: async (jobId) => {
    const response = await api.get(`/api/jobs/${jobId}`)
    return response.data
  },
  
  generateOutreach: async (jobId, clerkUserId) => {
    const response = await api.post(`/api/jobs/${jobId}/outreach`, null, {
      params: { clerk_user_id: clerkUserId }
    })
    return response.data
  },
}
