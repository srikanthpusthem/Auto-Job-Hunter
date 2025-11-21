import { useState, useEffect, useMemo } from 'react'
import { useUser } from '@clerk/clerk-react'
import { 
  MapPin, Briefcase, DollarSign, Calendar, ExternalLink, Mail, 
  Loader2, Filter, X, ChevronDown, CheckCircle, Clock, 
  FileText, Send, XCircle, Eye
} from 'lucide-react'
import { jobsApi } from '../lib/api'
import { useJobStore } from '../store/jobStore'

const KANBAN_COLUMNS = [
  { id: 'new', title: 'New Matches', status: 'new', color: 'bg-blue-50 border-blue-200' },
  { id: 'pending', title: 'Pending Review', status: 'matched', color: 'bg-yellow-50 border-yellow-200' },
  { id: 'outreach', title: 'Ready for Outreach', status: 'outreach', color: 'bg-purple-50 border-purple-200' },
  { id: 'draft', title: 'Draft Created', status: 'draft', color: 'bg-indigo-50 border-indigo-200' },
  { id: 'applied', title: 'Applied', status: 'applied', color: 'bg-green-50 border-green-200' },
  { id: 'rejected', title: 'Rejected', status: 'rejected', color: 'bg-red-50 border-red-200' },
]

export default function JobsPage() {
  const { user } = useUser()
  const { jobs, setJobs, loading, setLoading } = useJobStore()
  const [generatingOutreach, setGeneratingOutreach] = useState(null)
  const [selectedJob, setSelectedJob] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [scanRuns, setScanRuns] = useState([])
  
  const [filters, setFilters] = useState({
    scan_run_id: 'all',
    date_from: '',
    date_to: '',
    source: 'all',
    min_match_score: '',
    sort_by: 'created_at',
    sort_order: 'desc',
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
      // Update job status to 'draft' after outreach generated
      setJobs(prev => prev.map(j => 
        j._id === job._id ? { ...j, status: 'draft', outreach: result } : j
      ))
      alert('Outreach generated! Check the Draft Created column.')
    } catch (error) {
      console.error('Error generating outreach:', error)
      alert('Failed to generate outreach')
    } finally {
      setGeneratingOutreach(null)
    }
  }

  const handleMoveJob = (jobId, newStatus) => {
    setJobs(prev => prev.map(j => 
      j._id === jobId ? { ...j, status: newStatus } : j
    ))
  }

  const getMatchColor = (score) => {
    if (score >= 0.9) return 'text-green-600 bg-green-50 border-green-200'
    if (score >= 0.7) return 'text-blue-600 bg-blue-50 border-blue-200'
    return 'text-orange-600 bg-orange-50 border-orange-200'
  }

  const formatRelativeDate = (dateStr) => {
    if (!dateStr) return 'Recently'
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
    return `${Math.floor(diffDays / 30)}mo ago`
  }

  // Group jobs by status/column
  const jobsByColumn = useMemo(() => {
    const grouped = {}
    KANBAN_COLUMNS.forEach(col => {
      grouped[col.id] = jobs.filter(job => {
        const status = job.status?.toLowerCase() || 'new'
        if (col.id === 'new') return status === 'new'
        if (col.id === 'pending') return status === 'matched'
        if (col.id === 'outreach') return status === 'outreach' || (status === 'matched' && job.outreach?.email_subject)
        if (col.id === 'draft') return status === 'draft'
        if (col.id === 'applied') return status === 'applied'
        if (col.id === 'rejected') return status === 'rejected'
        return false
      })
    })
    return grouped
  }, [jobs])

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
          <h1 className="text-3xl font-bold text-gray-900">Job Pipeline</h1>
          <p className="text-gray-600 mt-1">
            {jobs.length} jobs in your pipeline
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            showFilters ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
              <select
                value={filters.source}
                onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">All Sources</option>
                <option value="google_jobs">Google Jobs</option>
                <option value="yc">YC Jobs</option>
                <option value="linkedin">LinkedIn</option>
                <option value="indeed">Indeed</option>
              </select>
            </div>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Posted From</label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Posted To</label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map(column => (
          <div 
            key={column.id} 
            className={`flex-shrink-0 w-80 ${column.color} rounded-xl border-2 p-4`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">{column.title}</h3>
              <span className="px-2 py-1 bg-white rounded-full text-xs font-medium text-gray-600">
                {jobsByColumn[column.id]?.length || 0}
              </span>
            </div>
            
            <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
              {jobsByColumn[column.id]?.map(job => (
                <JobCard 
                  key={job._id} 
                  job={job} 
                  onView={() => setSelectedJob(job)}
                  onGenerateOutreach={() => handleGenerateOutreach(job)}
                  onMove={handleMoveJob}
                  generating={generatingOutreach === job._id}
                  getMatchColor={getMatchColor}
                  formatRelativeDate={formatRelativeDate}
                />
              ))}
              {(!jobsByColumn[column.id] || jobsByColumn[column.id].length === 0) && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No jobs in this stage
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Job Detail Modal */}
      {selectedJob && (
        <JobDetailModal 
          job={selectedJob} 
          onClose={() => setSelectedJob(null)}
          onGenerateOutreach={() => handleGenerateOutreach(selectedJob)}
          onMove={handleMoveJob}
        />
      )}

      {jobs.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl">
          <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No jobs found</h3>
          <p className="text-gray-600">Start a job scan from the Dashboard</p>
        </div>
      )}
    </div>
  )
}

function JobCard({ job, onView, onGenerateOutreach, onMove, generating, getMatchColor, formatRelativeDate }) {
  return (
    <div 
      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onView}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 truncate">{job.title}</h4>
          <p className="text-sm text-gray-600 truncate">{job.company}</p>
        </div>
        {job.match_score && (
          <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium border ${getMatchColor(job.match_score)}`}>
            {Math.round(job.match_score * 100)}%
          </span>
        )}
      </div>

      {job.description && (
        <p className="text-xs text-gray-500 line-clamp-2 mb-3">{job.description.substring(0, 100)}...</p>
      )}

      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
        <MapPin className="w-3 h-3" />
        <span className="truncate">{job.location || 'Remote'}</span>
        <span>•</span>
        <span>{formatRelativeDate(job.posted_at || job.metadata?.collected_at)}</span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onGenerateOutreach()
          }}
          disabled={generating}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-purple-600 text-white text-xs font-medium rounded hover:bg-purple-700 disabled:opacity-50"
        >
          {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
          Outreach
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onMove(job._id, 'applied')
          }}
          className="px-2 py-1.5 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700"
        >
          <CheckCircle className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

function JobDetailModal({ job, onClose, onGenerateOutreach, onMove }) {
  const [activeTab, setActiveTab] = useState('details')

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{job.title}</h2>
            <p className="text-lg text-gray-600">{job.company}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 flex gap-4 px-6">
          {['details', 'insights', 'outreach'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-2 border-b-2 font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'details' && (
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Job Information</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{job.location || 'Not specified'}</span>
                    {job.remote && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Remote</span>}
                  </div>
                  {job.salary && (job.salary.min || job.salary.max) && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span>
                        {job.salary.min && job.salary.max
                          ? `${job.salary.currency || '$'}${job.salary.min.toLocaleString()}-${job.salary.max.toLocaleString()}`
                          : job.salary.min
                          ? `${job.salary.currency || '$'}${job.salary.min.toLocaleString()}+`
                          : `${job.salary.currency || '$'}${job.salary.max.toLocaleString()}`
                        }
                        {job.salary.interval && `/${job.salary.interval}`}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>Posted {new Date(job.posted_at || job.metadata?.collected_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Description</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{job.description || 'No description available'}</p>
              </div>
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">AI Match Analysis</h3>
                {job.match_score && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Overall Match Score</span>
                      <span className="text-lg font-bold text-blue-600">{Math.round(job.match_score * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${job.match_score * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                {job.match_reasoning && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700">{job.match_reasoning}</p>
                  </div>
                )}
              </div>
              {job.skills_extracted && job.skills_extracted.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Required Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {job.skills_extracted.map((skill, idx) => (
                      <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'outreach' && (
            <div className="space-y-4">
              {job.outreach?.email_subject ? (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Generated Outreach</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500">Subject</label>
                      <p className="text-sm text-gray-900">{job.outreach.email_subject}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Email Body</label>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{job.outreach.email_body}</p>
                    </div>
                    {job.outreach.linkedin_dm && (
                      <div>
                        <label className="text-xs font-medium text-gray-500">LinkedIn DM</label>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{job.outreach.linkedin_dm}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Mail className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">No outreach generated yet</p>
                  <button
                    onClick={onGenerateOutreach}
                    className="px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700"
                  >
                    Generate Outreach
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => onMove(job._id, 'applied')}
              className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700"
            >
              Mark as Applied
            </button>
            <button
              onClick={() => onMove(job._id, 'rejected')}
              className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700"
            >
              Reject
            </button>
          </div>
          {(job.apply_url || job.listing_url) && (
            <a
              href={job.apply_url || job.listing_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
            >
              Apply Now
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
