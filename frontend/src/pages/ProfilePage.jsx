import { useUser } from '@clerk/clerk-react'
import { Upload, Save, Loader2, FileText, CheckCircle, X } from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { userApi } from '../lib/api'
import { useProfileStore } from '../store/profileStore'

export default function ProfilePage() {
  const { user } = useUser()
  const { setProfile } = useProfileStore()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [parsedData, setParsedData] = useState(null)
  const fileInputRef = useRef(null)
  
  const [formData, setFormData] = useState({
    skills: '',
    keywords: '',
    summary: '',
    experience: '5',
    location: 'Remote',
    remoteOnly: true,
    linkedinUrl: '',
    jobTypes: [],
    employmentTypes: [],
    salaryMin: '',
    salaryMax: '',
    salaryCurrency: 'USD',
  })

  const loadProfile = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const data = await userApi.getProfile(user.id)
      setProfile(data)

      if (data.profile) {
        const profileData = data.profile
        setFormData({
          skills: profileData.skills?.join(', ') || '',
          keywords: profileData.keywords?.join(', ') || '',
          summary: profileData.summary || '',
          experience: profileData.experience_years?.toString() || '5',
          location: profileData.preferences?.location || 'Remote',
          remoteOnly: profileData.preferences?.remote_only ?? true,
          linkedinUrl: profileData.linkedin_url || '',
          jobTypes: profileData.preferences?.job_types || [],
          employmentTypes: profileData.preferences?.employment_types || [],
          salaryMin: profileData.preferences?.salary_min?.toString() || '',
          salaryMax: profileData.preferences?.salary_max?.toString() || '',
          salaryCurrency: profileData.preferences?.salary_currency || 'USD',
        })

        if (profileData.resume_file_url) {
          setUploadedFile(profileData.resume_file_url.split('/').pop())
        }
      }
    } catch (error) {
      console.warn('Profile not found, using defaults', error)
    } finally {
      setLoading(false)
    }
  }, [setProfile, user?.id])

  // Load profile on mount
  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user?.id) return

    setSaving(true)
    try {
      const profileData = {
        clerk_user_id: user.id,
        name: user.fullName || 'User',
        email: user.primaryEmailAddress?.emailAddress || '',
        skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean),
        summary: formData.summary,
        experience_years: parseInt(formData.experience) || 0,
        linkedin_url: formData.linkedinUrl,
        preferences: {
          location: formData.location,
          remote_only: formData.remoteOnly,
          job_types: formData.jobTypes,
          employment_types: formData.employmentTypes,
          salary_min: formData.salaryMin ? parseFloat(formData.salaryMin) : null,
          salary_max: formData.salaryMax ? parseFloat(formData.salaryMax) : null,
          salary_currency: formData.salaryCurrency,
        }
      }

      await userApi.createOrUpdateProfile(profileData)
      alert('Profile saved successfully!')
      await loadProfile() // Reload to get updated data
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleFileUpload = async (file) => {
    if (!user?.id) return
    
    // Validate file type
    const allowedTypes = ['.pdf', '.doc', '.docx']
    const fileExt = '.' + file.name.split('.').pop().toLowerCase()
    if (!allowedTypes.includes(fileExt)) {
      alert('Invalid file type. Please upload PDF, DOC, or DOCX files.')
      return
    }
    
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit.')
      return
    }
    
    setUploading(true)
    try {
      const result = await userApi.uploadResume(user.id, file)
      setUploadedFile(file.name)
      
      if (result.parsed && result.extracted_data) {
        setParsedData(result.extracted_data)
        
        // Auto-populate form with extracted data
        const extracted = result.extracted_data
        setFormData(prev => ({
          ...prev,
          summary: extracted.summary || prev.summary, // Auto-update summary from resume
          skills: [...new Set([...prev.skills.split(',').map(s => s.trim()).filter(Boolean), ...(extracted.skills || [])])].join(', '),
          keywords: [...new Set([...prev.keywords.split(',').map(k => k.trim()).filter(Boolean), ...(extracted.keywords || [])])].join(', '),
          experience: extracted.experience_years?.toString() || prev.experience,
        }))
        
        alert('Resume uploaded and parsed successfully! Professional summary, skills, and keywords have been extracted.')
      } else {
        alert('Resume uploaded, but parsing failed. Please manually enter your information.')
      }
    } catch (error) {
      console.error('Error uploading resume:', error)
      alert('Failed to upload resume')
    } finally {
      setUploading(false)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleMultiSelect = (name, value) => {
    setFormData(prev => {
      const current = prev[name] || []
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value]
      return { ...prev, [name]: updated }
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const jobTypeOptions = ['Engineering', 'Design', 'Product', 'Marketing', 'Sales', 'Operations', 'Data Science', 'Other']
  const employmentTypeOptions = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance']

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Your Profile</h1>
        <p className="text-gray-600 mt-1">
          Manage your information and job preferences
        </p>
      </div>

      {/* Profile Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={user?.fullName || ''}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={user?.primaryEmailAddress?.emailAddress || ''}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>
            </div>
          </div>

          {/* Professional Summary */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Professional Summary</h2>
            <textarea
              name="summary"
              value={formData.summary}
              onChange={handleChange}
              rows={4}
              placeholder="Write a brief professional summary about yourself..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Skills */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Skills</h2>
            <textarea
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              rows={3}
              placeholder="e.g., Python, FastAPI, React, Machine Learning"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">Separate skills with commas</p>
          </div>

          {/* Keywords for Job Search */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Keywords for Job Search</h2>
            <textarea
              name="keywords"
              value={formData.keywords}
              onChange={handleChange}
              rows={2}
              placeholder="e.g., Python developer, remote work, startup, AI/ML"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">Keywords help us find better job matches. Separate with commas.</p>
          </div>

          {/* Experience */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Experience</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Years of Experience
                </label>
                <input
                  type="number"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  name="linkedinUrl"
                  value={formData.linkedinUrl}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Resume Upload */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Resume</h2>
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer relative"
            >
              {uploading ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-3" />
                  <p className="text-sm text-gray-600">Uploading and parsing resume...</p>
                </div>
              ) : uploadedFile ? (
                <div className="flex flex-col items-center">
                  <CheckCircle className="w-12 h-12 text-green-600 mb-3" />
                  <p className="text-sm font-medium text-gray-900">{uploadedFile}</p>
                  <p className="text-xs text-gray-500 mt-1">Click to upload a different file</p>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PDF, DOC, or DOCX (max 5MB)</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={handleFileSelect}
              />
            </div>
            
            {parsedData && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-900 mb-2">Resume parsed successfully!</p>
                <div className="text-sm text-green-700 space-y-1">
                  {parsedData.summary && (
                    <p className="font-medium">Summary extracted and auto-filled</p>
                  )}
                  {parsedData.skills?.length > 0 && (
                    <p>Skills extracted: {parsedData.skills.join(', ')}</p>
                  )}
                  {parsedData.keywords?.length > 0 && (
                    <p>Keywords extracted: {parsedData.keywords.slice(0, 5).join(', ')}...</p>
                  )}
                  {parsedData.experience_years > 0 && (
                    <p>Experience: {parsedData.experience_years} years</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Job Preferences */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Preferences</h2>
            
            {/* Location */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., San Francisco, CA or Remote"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center pt-8">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="remoteOnly"
                    checked={formData.remoteOnly}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Remote Only</span>
                </label>
              </div>
            </div>

            {/* Job Types */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Job Types
              </label>
              <div className="flex flex-wrap gap-2">
                {jobTypeOptions.map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleMultiSelect('jobTypes', type)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      formData.jobTypes.includes(type)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Employment Types */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Employment Types
              </label>
              <div className="flex flex-wrap gap-2">
                {employmentTypeOptions.map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleMultiSelect('employmentTypes', type)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      formData.employmentTypes.includes(type)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Salary Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Desired Salary Range
              </label>
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <select
                    name="salaryCurrency"
                    value={formData.salaryCurrency}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
                <div>
                  <input
                    type="number"
                    name="salaryMin"
                    value={formData.salaryMin}
                    onChange={handleChange}
                    placeholder="Min"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    name="salaryMax"
                    value={formData.salaryMax}
                    onChange={handleChange}
                    placeholder="Max"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  per year
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
