import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { Briefcase, TrendingUp, Clock, CheckCircle, RefreshCw, AlertCircle, BarChart3, Target, Search, MapPin, Globe, Loader2 } from 'lucide-react'
import { dashboardApi, jobsApi, userApi } from '../lib/api'

export default function Dashboard() {
  const { user } = useUser()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searching, setSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState({
    keywords: '',
    location: '',
    remoteOnly: false,
    sources: ['google_jobs', 'yc']
  })
  const [userProfile, setUserProfile] = useState(null)

  const loadDashboardData = async () => {
    if (!user?.id) return
    
    setLoading(true)
    setError(null)
    try {
      const data = await dashboardApi.getStats(user.id)
      setStats(data)
    } catch (err) {
      console.error('Error loading dashboard stats:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      loadDashboardData()
      loadUserProfile()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const loadUserProfile = async () => {
    if (!user?.id) return
    try {
      const data = await userApi.getProfile(user.id)
      setUserProfile(data)
      if (data.profile) {
        // Pre-fill search with profile keywords
        const keywords = data.profile.keywords?.join(' ') || data.profile.skills?.join(' ') || ''
        const location = data.profile.preferences?.location || ''
        setSearchQuery(prev => ({
          ...prev,
          keywords: keywords,
          location: location,
          remoteOnly: data.profile.preferences?.remote_only || false
        }))
      }
    } catch (err) {
      console.log('Could not load user profile:', err)
    }
  }

  const handleSearchJobs = async () => {
    if (!user?.id) return
    
    setSearching(true)
    try {
      // Build keywords from search query and profile
      const keywords = searchQuery.keywords.split(',').map(k => k.trim()).filter(Boolean)
      if (userProfile?.profile?.keywords) {
        keywords.push(...userProfile.profile.keywords)
      }
      
      await jobsApi.triggerScan({
        clerk_user_id: user.id,
        sources: searchQuery.sources,
        match_threshold: 0.6,
        keywords: keywords.length > 0 ? keywords : undefined,
        location: searchQuery.location || undefined
      })
      
      alert('Job search started! Check the Jobs page in a few moments.')
      // Navigate to jobs page after a delay
      setTimeout(() => {
        navigate('/jobs')
      }, 2000)
    } catch (error) {
      console.error('Error starting job search:', error)
      alert('Failed to start job search')
    } finally {
      setSearching(false)
    }
  }

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0'
    return num.toLocaleString()
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case 'scan_completed':
        return Briefcase
      case 'job_matched':
        return CheckCircle
      case 'application_sent':
        return TrendingUp
      default:
        return Clock
    }
  }

  const getActivityColor = (type) => {
    switch (type) {
      case 'scan_completed':
        return 'bg-blue-100 text-blue-600'
      case 'job_matched':
        return 'bg-green-100 text-green-600'
      case 'application_sent':
        return 'bg-purple-100 text-purple-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName || 'there'}!
          </h1>
          <p className="text-gray-600 mt-1">Loading your dashboard...</p>
        </div>
        
        {/* Loading skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName || 'there'}!
          </h1>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div className="flex-1">
              <h3 className="font-medium text-red-900">Error loading dashboard</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <button
              onClick={loadDashboardData}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  const dashboardStats = stats?.stats || {}
  const recentActivity = stats?.recent_activity || []
  const topSources = stats?.top_sources || []

  const statCards = [
    {
      name: 'Total Jobs Scanned',
      value: formatNumber(dashboardStats.total_jobs_scanned || 0),
      icon: Briefcase,
      color: 'bg-blue-500'
    },
    {
      name: 'Matched Jobs',
      value: formatNumber(dashboardStats.matched_jobs || 0),
      icon: CheckCircle,
      color: 'bg-green-500'
    },
    {
      name: 'Applications Sent',
      value: formatNumber(dashboardStats.applications_sent || 0),
      icon: TrendingUp,
      color: 'bg-purple-500'
    },
    {
      name: 'Pending Reviews',
      value: formatNumber(dashboardStats.pending_reviews || 0),
      icon: Clock,
      color: 'bg-orange-500'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.firstName || 'there'}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here's what's happening with your job search
        </p>
        </div>
        <button
          onClick={loadDashboardData}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Search Jobs Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Search Jobs</h2>
        <div className="space-y-4">
          {/* Keywords Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Keywords
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery.keywords}
                onChange={(e) => setSearchQuery(prev => ({ ...prev, keywords: e.target.value }))}
                placeholder="e.g., Python developer, React, remote work"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Separate keywords with commas</p>
          </div>

          {/* Location and Remote */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery.location}
                  onChange={(e) => setSearchQuery(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g., San Francisco, CA or Remote"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={searchQuery.remoteOnly}
                  onChange={(e) => setSearchQuery(prev => ({ ...prev, remoteOnly: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Remote Only</span>
              </label>
            </div>
          </div>

          {/* Sources Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Sources
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'google_jobs', label: 'Google Jobs' },
                { id: 'yc', label: 'YC Jobs' },
                { id: 'linkedin', label: 'LinkedIn' },
                { id: 'indeed', label: 'Indeed' },
                { id: 'wellfound', label: 'Wellfound' }
              ].map(source => (
                <button
                  key={source.id}
                  type="button"
                  onClick={() => {
                    setSearchQuery(prev => ({
                      ...prev,
                      sources: prev.sources.includes(source.id)
                        ? prev.sources.filter(s => s !== source.id)
                        : [...prev.sources, source.id]
                    }))
                  }}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    searchQuery.sources.includes(source.id)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {source.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearchJobs}
            disabled={searching || searchQuery.sources.length === 0}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {searching ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Searching Jobs...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Search Jobs
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.name}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Additional Stats Row */}
      {(dashboardStats.average_match_score > 0 || dashboardStats.high_match_jobs > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {dashboardStats.average_match_score > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-5 h-5 text-blue-600" />
                <p className="text-sm font-medium text-gray-600">Average Match Score</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(dashboardStats.average_match_score * 100)}%
              </p>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${dashboardStats.average_match_score * 100}%` }}
                ></div>
              </div>
            </div>
          )}
          
          {dashboardStats.high_match_jobs > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="w-5 h-5 text-green-600" />
                <p className="text-sm font-medium text-gray-600">High Match Jobs (≥80%)</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(dashboardStats.high_match_jobs)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Top Sources */}
      {topSources.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Top Job Sources</h2>
          <div className="flex flex-wrap gap-3">
            {topSources.map((source) => (
              <div
                key={source.source}
                className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg"
              >
                <span className="font-medium text-gray-900 capitalize">
                  {source.source.replace('_', ' ')}
                </span>
                <span className="text-sm text-gray-600">({source.count})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
        {recentActivity.length > 0 ? (
        <div className="space-y-4">
            {recentActivity.map((activity, index) => {
              const Icon = getActivityIcon(activity.type)
              return (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className={`w-10 h-10 ${getActivityColor(activity.type)} rounded-full flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
                    <p className="font-medium text-gray-900">{activity.message}</p>
                    <p className="text-sm text-gray-600">{activity.details}</p>
                  </div>
                  <span className="text-sm text-gray-500">{activity.relative_time}</span>
            </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No recent activity</p>
            <p className="text-sm text-gray-500 mt-1">Start a job scan to see activity here</p>
          </div>
        )}
      </div>
    </div>
  )
}
