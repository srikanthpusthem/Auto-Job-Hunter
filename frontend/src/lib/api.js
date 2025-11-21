import axios from 'axios'

// Detect if we're on network access (not localhost)
// If accessing from network IP, use network IP for API too
const getApiBaseUrl = () => {
  // Check if VITE_API_BASE_URL is explicitly set
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }
  
  // If accessing from network IP, use network IP for backend
  const hostname = window.location.hostname
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `http://${hostname}:8000`
  }
  
  // Default to localhost
  return 'http://localhost:8000'
}

const API_BASE_URL = getApiBaseUrl()

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
  
  uploadResume: async (clerkUserId, file) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('/api/users/resume', formData, {
      params: { clerk_user_id: clerkUserId },
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },
}

// Jobs API
export const jobsApi = {
  triggerScan: async (data) => {
    const response = await api.post('/api/jobs/scan', data)
    return response.data
  },
  
  listJobs: async (clerkUserId, filters = {}) => {
    const params = {
      clerk_user_id: clerkUserId,
      limit: filters.limit || 50,
      ...(filters.status && { status: filters.status }),
      ...(filters.scan_run_id && { scan_run_id: filters.scan_run_id }),
      ...(filters.date_from && { date_from: filters.date_from }),
      ...(filters.date_to && { date_to: filters.date_to }),
      ...(filters.source && { source: filters.source }),
      ...(filters.min_match_score && { min_match_score: filters.min_match_score }),
      ...(filters.sort_by && { sort_by: filters.sort_by }),
      ...(filters.sort_order && { sort_order: filters.sort_order }),
    }
    const response = await api.get('/api/jobs', { params })
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

  updateStatus: async (jobId, status) => {
    const response = await api.patch(`/api/jobs/${jobId}/status`, { status })
    return response.data
  },
}

// Dashboard API
export const dashboardApi = {
  getStats: async (clerkUserId) => {
    const response = await api.get('/api/dashboard/stats', {
      params: { clerk_user_id: clerkUserId }
    })
    return response.data
  },
}

// Outreach API
export const outreachApi = {
  getTemplates: async (clerkUserId) => {
    const response = await api.get('/api/outreach/templates', {
      params: { clerk_user_id: clerkUserId }
    })
    return response.data
  },

  createTemplate: async (templateData) => {
    const response = await api.post('/api/outreach/templates', templateData)
    return response.data
  },

  updateTemplate: async (templateId, templateData) => {
    const response = await api.put(`/api/outreach/templates/${templateId}`, templateData)
    return response.data
  },

  deleteTemplate: async (templateId, clerkUserId) => {
    const response = await api.delete(`/api/outreach/templates/${templateId}`, {
      params: { clerk_user_id: clerkUserId }
    })
    return response.data
  },
}

// Analytics API
export const analyticsApi = {
  getTimeline: async (clerkUserId, limit = 50) => {
    const response = await api.get('/api/agents/timeline', {
      params: { clerk_user_id: clerkUserId, limit }
    })
    return response.data
  },

  getScanHistory: async (clerkUserId, limit = 20) => {
    const response = await api.get('/api/agents/history', {
      params: { clerk_user_id: clerkUserId, limit }
    })
    return response.data
  },
}
