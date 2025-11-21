import { useState, useEffect, useMemo } from 'react'
import { useUser } from '@clerk/clerk-react'
import { MapPin, Briefcase, DollarSign, Calendar, ExternalLink, Mail, Loader2, Filter, X, ChevronDown } from 'lucide-react'
import { jobsApi } from '../lib/api'
import { useJobStore } from '../store/jobStore'

export default function JobsPage() {
  const { user } = useUser()
  const { jobs, setJobs, loading, setLoading } = useJobStore()
  const [generatingOutreach, setGeneratingOutreach] = useState(null)
  const [scanRuns, setScanRuns] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  
  // Filter states
  const [filters, setFilters] = useState({
    status: 'all',
    scan_run_id: 'all',
    date_from: '',
    date_to: '',
    source: 'all',
    min_match_score: '',
    sort_by: 'created_at',
    sort_order: 'desc',
    group_by: 'none' // none, scan_run, date_posted, source
  })

  useEffect(() => {
    if (user?.id) {
      loadJobs()
    }
  }, [user, filters])

  const loadJobs = async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const filterParams = {
        limit: 200,
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.scan_run_id !== 'all' && { scan_run_id: filters.scan_run_id }),
        ...(filters.date_from && { date_from: filters.date_from }),
        ...(filters.date_to && { date_to: filters.date_to }),
        ...(filters.source !== 'all' && { source: filters.source }),
        ...(filters.min_match_score && { min_match_score: parseFloat(filters.min_match_score) }),
        sort_by: filters.sort_by,
        sort_order: filters.sort_order,
      }
      
      const data = await jobsApi.listJobs(user.id, filterParams)
      setJobs(data.jobs || [])
      setScanRuns(data.scan_runs || [])
    } catch (error) {
      console.error('Error loading jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateOutreach = async (job) => {
    if (!user?.id) return
    setGeneratingOutreach(job._id)
    try {
      const result = await jobsApi.generateOutreach(job._id, user.id)
      const emailText = result.email_subject 
        ? `Subject: ${result.email_subject}\n\n${result.email_body || ''}`
        : result.email_body || 'No email content generated'
      const linkedinText = result.linkedin_dm || 'No LinkedIn message generated'
      alert(`Outreach generated!\n\nEmail:\n${emailText}\n\nLinkedIn:\n${linkedinText}`)
    } catch (error) {
      console.error('Error generating outreach:', error)
      alert('Failed to generate outreach')
    } finally {
      setGeneratingOutreach(null)
    }
  }

  const getMatchColor = (score) => {
    if (score >= 0.9) return 'text-green-600 bg-green-50'
    if (score >= 0.7) return 'text-blue-600 bg-blue-50'
    return 'text-orange-600 bg-orange-50'
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const formatRelativeDate = (dateStr) => {
    if (!dateStr) return 'Recently'
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  }

  // Group jobs based on group_by filter
  const groupedJobs = useMemo(() => {
    if (filters.group_by === 'none') {
      return { 'All Jobs': jobs }
    }
    
    if (filters.group_by === 'scan_run') {
      const grouped = {}
      jobs.forEach(job => {
        const runId = job.metadata?.scan_run_id || 'unknown'
        const run = scanRuns.find(r => r._id === runId)
        const runLabel = run 
          ? `Scan ${formatDate(run.started_at)} (${run.jobs_matched || 0} jobs)`
          : 'Unknown Scan'
        if (!grouped[runLabel]) grouped[runLabel] = []
        grouped[runLabel].push(job)
      })
      return grouped
    }
    
    if (filters.group_by === 'date_posted') {
      const grouped = {}
      jobs.forEach(job => {
        const postedDate = job.posted_at || job.metadata?.collected_at
        const dateKey = postedDate 
          ? formatDate(postedDate)
          : 'Unknown Date'
        if (!grouped[dateKey]) grouped[dateKey] = []
        grouped[dateKey].push(job)
      })
      return grouped
    }
    
    if (filters.group_by === 'source') {
      const grouped = {}
      jobs.forEach(job => {
        const source = job.source || 'unknown'
        const sourceLabel = source.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
        if (!grouped[sourceLabel]) grouped[sourceLabel] = []
        grouped[sourceLabel].push(job)
      })
      return grouped
    }
    
    return { 'All Jobs': jobs }
  }, [jobs, filters.group_by, scanRuns])

  const clearFilters = () => {
    setFilters({
      status: 'all',
      scan_run_id: 'all',
      date_from: '',
      date_to: '',
      source: 'all',
      min_match_score: '',
      sort_by: 'created_at',
      sort_order: 'desc',
      group_by: 'none'
    })
  }

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.status !== 'all') count++
    if (filters.scan_run_id !== 'all') count++
    if (filters.date_from) count++
    if (filters.date_to) count++
    if (filters.source !== 'all') count++
    if (filters.min_match_score) count++
    if (filters.group_by !== 'none') count++
    return count
  }, [filters])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Matched Jobs</h1>
          <p className="text-gray-600 mt-1">
            {jobs.length} jobs found matching your profile
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              showFilters || activeFiltersCount > 0
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="bg-white text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Filter & Sort Jobs</h2>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Clear All
            </button>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="matched">Matched</option>
                <option value="applied">Applied</option>
                <option value="rejected">Rejected</option>
                <option value="interview">Interview</option>
                <option value="offer">Offer</option>
              </select>
            </div>

            {/* Scan Run Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Scan Run</label>
              <select
                value={filters.scan_run_id}
                onChange={(e) => setFilters(prev => ({ ...prev, scan_run_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Scans</option>
                {scanRuns.map(run => (
                  <option key={run._id} value={run._id}>
                    {formatDate(run.started_at)} ({run.jobs_matched || 0} jobs)
                  </option>
                ))}
              </select>
            </div>

            {/* Source Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
              <select
                value={filters.source}
                onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Sources</option>
                <option value="google_jobs">Google Jobs</option>
                <option value="yc">YC Jobs</option>
                <option value="linkedin">LinkedIn</option>
                <option value="indeed">Indeed</option>
                <option value="wellfound">Wellfound</option>
              </select>
            </div>

            {/* Min Match Score */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Min Match Score</label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={filters.min_match_score}
                onChange={(e) => setFilters(prev => ({ ...prev, min_match_score: e.target.value }))}
                placeholder="0.0 - 1.0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Posted From</label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Posted To</label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={filters.sort_by}
                onChange={(e) => setFilters(prev => ({ ...prev, sort_by: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="created_at">Date Added</option>
                <option value="posted_at">Date Posted</option>
                <option value="match_score">Match Score</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
              <select
                value={filters.sort_order}
                onChange={(e) => setFilters(prev => ({ ...prev, sort_order: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Group By */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Group By</label>
            <div className="flex gap-2">
              {['none', 'scan_run', 'date_posted', 'source'].map(option => (
                <button
                  key={option}
                  onClick={() => setFilters(prev => ({ ...prev, group_by: option }))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filters.group_by === option
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option === 'none' ? 'No Grouping' : option === 'scan_run' ? 'Scan Run' : option === 'date_posted' ? 'Date Posted' : 'Source'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Jobs List - Grouped */}
      <div className="space-y-6">
        {Object.entries(groupedJobs).map(([groupName, groupJobs]) => (
          <div key={groupName}>
            {filters.group_by !== 'none' && (
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-1">{groupName}</h2>
                <p className="text-sm text-gray-600">{groupJobs.length} jobs</p>
              </div>
            )}
            
            <div className="space-y-4">
              {groupJobs.map((job) => (
                <div
                  key={job._id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                        {job.match_score && (
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getMatchColor(job.match_score)}`}>
                            {Math.round(job.match_score * 100)}% Match
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-gray-600 font-medium">{job.company}</p>
                        {job.source && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {job.source.replace('_', ' ')}
                          </span>
                        )}
                        {job.metadata?.scan_run_id && (
                          <span className="text-xs text-gray-500">
                            Scan: {formatRelativeDate(scanRuns.find(r => r._id === job.metadata.scan_run_id)?.started_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {job.description && (
                    <p className="text-gray-700 mb-4 line-clamp-2">{job.description.substring(0, 200)}...</p>
                  )}

                  <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {job.location || 'Location not specified'}
                    </div>
                    {job.salary && (job.salary.min || job.salary.max) && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {job.salary.min && job.salary.max
                          ? `${job.salary.currency || '$'}${job.salary.min.toLocaleString()}-${job.salary.max.toLocaleString()}`
                          : job.salary.min
                          ? `${job.salary.currency || '$'}${job.salary.min.toLocaleString()}+`
                          : `${job.salary.currency || '$'}${job.salary.max.toLocaleString()}`
                        }
                        {job.salary.interval && `/${job.salary.interval}`}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Posted {formatRelativeDate(job.posted_at || job.metadata?.collected_at)}
                    </div>
                    {job.remote && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Remote</span>
                    )}
                  </div>

                  <div className="flex gap-3">
                    {(job.apply_url || job.listing_url) && (
                      <a
                        href={job.apply_url || job.listing_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        {job.apply_url ? 'Apply Now' : 'View Listing'}
                      </a>
                    )}
                    {job.listing_url && job.apply_url && job.listing_url !== job.apply_url && (
                      <a
                        href={job.listing_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Listing
                      </a>
                    )}
                    <button
                      onClick={() => handleGenerateOutreach(job)}
                      disabled={generatingOutreach === job._id}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                    >
                      {generatingOutreach === job._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Mail className="w-4 h-4" />
                      )}
                      Generate Outreach
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {jobs.length === 0 && (
        <div className="text-center py-12">
          <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No jobs found</h3>
          <p className="text-gray-600">Try adjusting your filters or start a new search from the Dashboard</p>
        </div>
      )}
    </div>
  )
}
