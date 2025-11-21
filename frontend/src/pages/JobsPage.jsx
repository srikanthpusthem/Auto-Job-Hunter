import { useState, useEffect, useMemo } from 'react'
import { useUser } from '@clerk/clerk-react'
import { 
  MapPin, Briefcase, DollarSign, Calendar, ExternalLink, Mail, 
  Loader2, Filter, X, ChevronDown, CheckCircle, Clock, 
  FileText, Send, XCircle, Eye, MoreHorizontal, Sparkles, Zap, Target
} from 'lucide-react'
import { 
  DndContext, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragOverlay
} from '@dnd-kit/core'
import { 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { jobsApi } from '../lib/api'
import { useJobStore } from '../store/jobStore'

const KANBAN_COLUMNS = [
  { id: 'new', title: 'New Matches', status: 'new', color: 'bg-blue-50 border-blue-200', icon: Sparkles },
  { id: 'pending', title: 'Pending Review', status: 'matched', color: 'bg-yellow-50 border-yellow-200', icon: Clock },
  { id: 'outreach', title: 'Ready for Outreach', status: 'outreach', color: 'bg-purple-50 border-purple-200', icon: Zap },
  { id: 'draft', title: 'Draft Created', status: 'draft', color: 'bg-indigo-50 border-indigo-200', icon: Mail },
  { id: 'applied', title: 'Applied', status: 'applied', color: 'bg-green-50 border-green-200', icon: CheckCircle },
  { id: 'rejected', title: 'Rejected', status: 'rejected', color: 'bg-red-50 border-red-200', icon: XCircle },
]

export default function JobsPage() {
  const { user } = useUser()
  const { jobs, setJobs, loading, setLoading } = useJobStore()
  const [generatingOutreach, setGeneratingOutreach] = useState(null)
  const [selectedJob, setSelectedJob] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [activeId, setActiveId] = useState(null)
  
  const [filters, setFilters] = useState({
    scan_run_id: 'all',
    date_from: '',
    date_to: '',
    source: 'all',
    min_match_score: '',
    sort_by: 'created_at',
    sort_order: 'desc',
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    if (user?.id) {
      loadJobs()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleMoveJob = async (jobId, newStatus) => {
    // Optimistic update
    setJobs(prev => prev.map(j => 
      j._id === jobId ? { ...j, status: newStatus } : j
    ))

    try {
      await jobsApi.updateStatus(jobId, newStatus)
    } catch (error) {
      console.error('Error updating status:', error)
      // Revert on error (reload jobs)
      loadJobs()
    }
  }

  const handleDragStart = (event) => {
    setActiveId(event.active.id)
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    
    if (!over) {
      setActiveId(null)
      return
    }

    const activeJob = jobs.find(j => j._id === active.id)
    const overId = over.id
    
    // Find which column we dropped into
    let newStatus = null
    
    // Check if dropped on a column container
    const column = KANBAN_COLUMNS.find(col => col.id === overId)
    if (column) {
      newStatus = column.status
    } else {
      // Check if dropped on another job
      const overJob = jobs.find(j => j._id === overId)
      if (overJob) {
        // Find the column of the job we dropped onto
        // This logic needs to map job status back to column status if they differ
        // But for simplicity, we can assume job.status maps to column.status
        // However, our columns map multiple statuses (e.g. 'matched' -> 'pending')
        // So we need to be careful.
        
        // Let's find which column the overJob belongs to
        const overColumn = KANBAN_COLUMNS.find(col => {
           const status = overJob.status?.toLowerCase() || 'new'
           if (col.id === 'new') return status === 'new'
           if (col.id === 'pending') return status === 'matched'
           if (col.id === 'outreach') return status === 'outreach' || (status === 'matched' && overJob.outreach?.email_subject)
           if (col.id === 'draft') return status === 'draft'
           if (col.id === 'applied') return status === 'applied'
           if (col.id === 'rejected') return status === 'rejected'
           return false
        })
        
        if (overColumn) {
          newStatus = overColumn.status
          // Special case for 'outreach' column which maps to 'outreach' status
          if (overColumn.id === 'outreach') newStatus = 'outreach'
          // Special case for 'pending' column which maps to 'matched' status
          if (overColumn.id === 'pending') newStatus = 'matched'
        }
      }
    }

    if (newStatus && activeJob.status !== newStatus) {
      handleMoveJob(activeJob._id, newStatus)
    }

    setActiveId(null)
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
    <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex-shrink-0">
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
      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCorners} 
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1 min-h-0">
          {KANBAN_COLUMNS.map(column => (
            <div 
              key={column.id} 
              className={`flex-shrink-0 w-80 flex flex-col ${column.color} rounded-xl border-2 p-4 h-full`}
            >
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <column.icon className="w-5 h-5 text-gray-700" />
                  <h3 className="font-bold text-gray-900">{column.title}</h3>
                </div>
                <span className="px-2 py-1 bg-white rounded-full text-xs font-medium text-gray-600 shadow-sm">
                  {jobsByColumn[column.id]?.length || 0}
                </span>
              </div>
              
              <SortableContext 
                id={column.id}
                items={jobsByColumn[column.id]?.map(j => j._id) || []}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3 overflow-y-auto flex-1 pr-2 custom-scrollbar">
                  {jobsByColumn[column.id]?.map(job => (
                    <SortableJobCard 
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
                    <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-300/50 rounded-lg">
                      No jobs
                    </div>
                  )}
                </div>
              </SortableContext>
            </div>
          ))}
        </div>
        <DragOverlay>
          {activeId ? (
             <JobCard 
               job={jobs.find(j => j._id === activeId)}
               getMatchColor={getMatchColor}
               formatRelativeDate={formatRelativeDate}
               isOverlay
             />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Job Detail Modal */}
      {selectedJob && (
        <JobDetailModal 
          job={selectedJob} 
          onClose={() => setSelectedJob(null)}
          onGenerateOutreach={() => handleGenerateOutreach(selectedJob)}
          onMove={handleMoveJob}
        />
      )}
    </div>
  )
}

function SortableJobCard(props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: props.job._id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <JobCard {...props} />
    </div>
  )
}

function JobCard({ job, onView, onGenerateOutreach, onMove, generating, getMatchColor, formatRelativeDate, isOverlay }) {
  if (!job) return null
  
  return (
    <div 
      className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer ${isOverlay ? 'shadow-xl rotate-2' : ''}`}
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

      {!isOverlay && (
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
      )}
    </div>
  )
}

function JobDetailModal({ job, onClose, onGenerateOutreach, onMove }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-7xl h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-start justify-between bg-gray-50">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">{job.title}</h2>
              {job.match_score && (
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                  job.match_score >= 0.9 ? 'bg-green-100 text-green-700' :
                  job.match_score >= 0.7 ? 'bg-blue-100 text-blue-700' :
                  'bg-orange-100 text-orange-700'
                }`}>
                  {Math.round(job.match_score * 100)}% Match
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-gray-600">
              <span className="font-medium text-lg">{job.company}</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {job.location || 'Remote'}
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Posted {new Date(job.posted_at || job.metadata?.collected_at).toLocaleDateString()}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* 3-Panel Layout */}
        <div className="flex-1 grid grid-cols-12 divide-x divide-gray-200 overflow-hidden">
          
          {/* Left Panel: Job Info (3 cols) */}
          <div className="col-span-3 overflow-y-auto p-6 bg-gray-50/50">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-6">Job Details</h3>
            
            <div className="space-y-6">
              {/* Salary */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase">Salary Estimation</span>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {job.salary && (job.salary.min || job.salary.max) ? (
                    <>
                      {job.salary.currency || '$'}
                      {job.salary.min ? job.salary.min.toLocaleString() : ''}
                      {job.salary.min && job.salary.max ? ' - ' : ''}
                      {job.salary.max ? job.salary.max.toLocaleString() : ''}
                      <span className="text-sm font-normal text-gray-500">/{job.salary.interval || 'yr'}</span>
                    </>
                  ) : (
                    <span className="text-gray-400 italic">Not specified</span>
                  )}
                </p>
              </div>

              {/* Source */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <ExternalLink className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase">Source</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium capitalize">{job.source || 'Unknown'}</span>
                  {(job.apply_url || job.listing_url) && (
                    <a 
                      href={job.apply_url || job.listing_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View Original
                    </a>
                  )}
                </div>
              </div>

              {/* Description Preview */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                <div className="text-sm text-gray-600 space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {job.description ? (
                    job.description.split('\n').map((para, i) => (
                      para.trim() && <p key={i}>{para}</p>
                    ))
                  ) : (
                    <p className="italic text-gray-400">No description available</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Middle Panel: AI Insights (6 cols) */}
          <div className="col-span-6 overflow-y-auto p-6">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">AI Insights</h3>
            </div>

            <div className="space-y-8">
              {/* Match Analysis */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-100">
                <h4 className="font-bold text-purple-900 mb-3">Why this matches you</h4>
                <p className="text-purple-800 leading-relaxed">
                  {job.match_reasoning || "This job aligns with your profile based on the skills and experience requirements found in the job description."}
                </p>
              </div>

              {/* Skills Matrix */}
              <div>
                <h4 className="font-bold text-gray-900 mb-4">Skills Analysis</h4>
                <div className="flex flex-wrap gap-2">
                  {job.skills_extracted?.map((skill, idx) => (
                    <span key={idx} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium border border-gray-200">
                      {skill}
                    </span>
                  )) || <p className="text-gray-500 italic">No skills extracted</p>}
                </div>
              </div>

              {/* Keywords Cloud (Mock for now) */}
              <div>
                <h4 className="font-bold text-gray-900 mb-4">Keywords Cloud</h4>
                <div className="p-6 bg-gray-50 rounded-xl border border-gray-200 text-center text-gray-400 text-sm">
                  Keywords visualization coming soon
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Actions (3 cols) */}
          <div className="col-span-3 overflow-y-auto p-6 bg-gray-50/50">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-6">Actions</h3>
            
            <div className="space-y-4">
              <button 
                onClick={() => onMove(job._id, 'applied')}
                className="w-full py-3 px-4 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <CheckCircle className="w-5 h-5" />
                Mark as Applied
              </button>

              <button 
                onClick={onGenerateOutreach}
                className="w-full py-3 px-4 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Mail className="w-5 h-5" />
                Generate Outreach
              </button>

              <button 
                onClick={() => onMove(job._id, 'rejected')}
                className="w-full py-3 px-4 bg-white text-red-600 border border-red-200 rounded-xl font-semibold hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
              >
                <XCircle className="w-5 h-5" />
                Reject Job
              </button>

              <div className="pt-6 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">Generated Content</h4>
                {job.outreach?.email_subject ? (
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-sm">
                    <div className="flex items-center gap-2 text-green-600 mb-2">
                      <CheckCircle className="w-4 h-4" />
                      <span className="font-medium">Draft Ready</span>
                    </div>
                    <p className="text-gray-600 line-clamp-3">{job.outreach.email_body}</p>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-400 bg-gray-100/50 rounded-xl border border-dashed border-gray-300">
                    No drafts yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
