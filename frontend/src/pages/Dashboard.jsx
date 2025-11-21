import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { 
  Briefcase, TrendingUp, Clock, CheckCircle, 
  Play, Pause, Zap, Activity, AlertCircle, 
  Target, Search
} from 'lucide-react'
import { dashboardApi } from '../lib/api'

import AgentStatus from '../components/dashboard/AgentStatus'
import AgentTimeline from '../components/dashboard/AgentTimeline'

export default function Dashboard() {
  const { user } = useUser()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load data
  useEffect(() => {
    if (user?.id) {
      loadDashboardData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const loadDashboardData = async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const data = await dashboardApi.getStats(user.id)
      setStats(data)
    } catch (err) {
      console.error('Error loading dashboard:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num) => num?.toLocaleString() || '0'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
        <AlertCircle className="w-5 h-5" />
        <p>{error}</p>
        <button onClick={loadDashboardData} className="ml-auto font-medium hover:underline">Retry</button>
      </div>
    )
  }

  const dashboardStats = stats?.stats || {}
  const recentActivity = stats?.recent_activity || []

  return (
    <div className="space-y-8">
      {/* Agent Status Panel */}
      <AgentStatus />

      {/* Agent Timeline */}
      <AgentTimeline />

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Scanned" 
          value={formatNumber(dashboardStats.total_jobs_scanned)} 
          icon={Activity} 
          color="text-blue-600" 
          bg="bg-blue-50" 
        />
        <StatCard 
          title="Matched Jobs" 
          value={formatNumber(dashboardStats.matched_jobs)} 
          icon={CheckCircle} 
          color="text-green-600" 
          bg="bg-green-50" 
        />
        <StatCard 
          title="Applications" 
          value={formatNumber(dashboardStats.applications_sent)} 
          icon={TrendingUp} 
          color="text-purple-600" 
          bg="bg-purple-50" 
        />
        <StatCard 
          title="Pending Review" 
          value={formatNumber(dashboardStats.pending_reviews)} 
          icon={Clock} 
          color="text-orange-600" 
          bg="bg-orange-50" 
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</button>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, idx) => (
                <div key={idx} className="p-4 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                  <div className={`mt-1 p-2 rounded-full ${
                    activity.type === 'job_matched' ? 'bg-green-100 text-green-600' :
                    activity.type === 'application_sent' ? 'bg-purple-100 text-purple-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {activity.type === 'job_matched' ? <CheckCircle className="w-4 h-4" /> :
                     activity.type === 'application_sent' ? <TrendingUp className="w-4 h-4" /> :
                     <Briefcase className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{activity.details}</p>
                    <p className="text-xs text-gray-400 mt-2">{activity.relative_time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">No recent activity</div>
            )}
          </div>
        </div>

        {/* Right Column: Insights & Sources */}
        <div className="space-y-6">
          {/* AI Insights Card */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-yellow-300" />
              <h3 className="font-bold">AI Insights</h3>
            </div>
            <div className="space-y-4 text-indigo-100 text-sm">
              <p>🚀 Your profile match rate increased by <span className="text-white font-bold">12%</span> this week.</p>
              <p>💡 You're a strong candidate for <span className="text-white font-bold">Senior Backend</span> roles.</p>
              <button className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-colors text-xs">
                View Full Analysis
              </button>
            </div>
          </div>

          {/* Source Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Top Sources</h3>
            <div className="space-y-3">
              {(stats?.top_sources || []).map((source, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      idx === 0 ? 'bg-blue-500' : idx === 1 ? 'bg-green-500' : 'bg-orange-500'
                    }`} />
                    <span className="capitalize text-gray-700">{source.source.replace('_', ' ')}</span>
                  </div>
                  <span className="font-medium text-gray-900">{source.count}</span>
                </div>
              ))}
              {(!stats?.top_sources || stats.top_sources.length === 0) && (
                <p className="text-gray-500 text-sm">No source data yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, color, bg }) {
  const Icon = icon
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${bg} ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}

