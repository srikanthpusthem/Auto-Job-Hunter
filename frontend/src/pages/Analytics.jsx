import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Loader2, RefreshCw } from 'lucide-react'
import { analyticsApi } from '../lib/api'
import Timeline from '../components/analytics/Timeline'
import ScanHistory from '../components/analytics/ScanHistory'

export default function Analytics() {
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [timeline, setTimeline] = useState([])
  const [history, setHistory] = useState([])

  useEffect(() => {
    if (user?.id) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      const [timelineData, historyData] = await Promise.all([
        analyticsApi.getTimeline(user.id),
        analyticsApi.getScanHistory(user.id)
      ])
      setTimeline(timelineData)
      setHistory(historyData)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  // Prepare chart data from history
  const chartData = history
    .slice()
    .reverse()
    .map(scan => ({
      date: new Date(scan.start_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      score: scan.avg_score || 0,
      found: scan.jobs_found_count || 0,
      new: scan.new_jobs_count || 0
    }))
    .slice(-7) // Last 7 scans

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Insights into agent performance and job scans</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column: Charts & History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Match Score Trend */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Match Score Trend</h3>
            <div className="h-64">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  No data available yet
                </div>
              )}
            </div>
          </div>

          {/* Jobs Found Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Jobs Found vs New</h3>
            <div className="h-64">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="found" name="Total Found" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="new" name="New Jobs" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  No data available yet
                </div>
              )}
            </div>
          </div>

          {/* Scan History Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Scans</h3>
            </div>
            <ScanHistory scans={history} />
          </div>
        </div>

        {/* Right Column: Live Timeline */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full max-h-[calc(100vh-8rem)] overflow-y-auto sticky top-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Agent Activity</h3>
            <Timeline logs={timeline} />
          </div>
        </div>
      </div>
    </div>
  )
}
