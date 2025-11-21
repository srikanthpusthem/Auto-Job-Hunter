import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { MapPin, Briefcase, DollarSign, Calendar, ExternalLink, Mail, Loader2 } from 'lucide-react'
import { jobsApi } from '../lib/api'
import { useJobStore } from '../store/jobStore'

export default function JobsPage() {
  const { user } = useUser()
  const { jobs, setJobs, loading, setLoading } = useJobStore()
  const [filter, setFilter] = useState('all')
  const [generatingOutreach, setGeneratingOutreach] = useState(null)

  useEffect(() => {
    if (user?.id) {
      loadJobs()
    }
  }, [user])

  const loadJobs = async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const data = await jobsApi.listJobs(user.id)
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
      alert(`Outreach generated!\n\nEmail: ${result.email}\n\nLinkedIn: ${result.linkedin_message}`)
    } catch (error) {
      console.error('Error generating outreach:', error)
      alert('Failed to generate outreach')
    } finally {
      setGeneratingOutreach(null)
    }
  }

  const filteredJobs = filter === 'all' ? jobs : jobs.filter(j => j.status === filter)

  const getMatchColor = (score) => {
    if (score >= 0.9) return 'text-green-600 bg-green-50'
    if (score >= 0.7) return 'text-blue-600 bg-blue-50'
    return 'text-orange-600 bg-orange-50'
  }

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
            {filteredJobs.length} jobs found matching your profile
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Jobs
          </button>
          <button
            onClick={() => setFilter('matched')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'matched'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Matched
          </button>
        </div>
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {filteredJobs.map((job) => (
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
                <p className="text-gray-600 font-medium">{job.company_name}</p>
              </div>
            </div>

            <p className="text-gray-700 mb-4">{job.description}</p>

            <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {job.location}
              </div>
              {job.salary_range && (
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  {job.salary_range}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Posted {job.posted_at || 'recently'}
              </div>
            </div>

            <div className="flex gap-3">
              {job.url && (
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Job
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

      {filteredJobs.length === 0 && (
        <div className="text-center py-12">
          <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No jobs found</h3>
          <p className="text-gray-600">Try adjusting your filters or start a new scan from your Profile</p>
        </div>
      )}
    </div>
  )
}
