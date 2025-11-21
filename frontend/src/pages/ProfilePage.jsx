import { useUser } from '@clerk/clerk-react'
import { Upload, Save, Briefcase, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { userApi, jobsApi } from '../lib/api'
import { useProfileStore } from '../store/profileStore'
import { useJobStore } from '../store/jobStore'

export default function ProfilePage() {
  const { user } = useUser()
  const { profile, setProfile } = useProfileStore()
  const { setScanning } = useJobStore()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [scanning, setScanningLocal] = useState(false)
  
  const [formData, setFormData] = useState({
    skills: '',
    experience: '5',
    location: 'Remote',
    remoteOnly: true,
  })

  // Load profile on mount
  useEffect(() => {
    if (user?.id) {
      loadProfile()
    }
  }, [user])

  const loadProfile = async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const data = await userApi.getProfile(user.id)
      setProfile(data)
      
      if (data.profile) {
        setFormData({
          skills: data.profile.skills?.join(', ') || '',
          experience: data.profile.experience_years?.toString() || '5',
          location: data.profile.preferences?.location || 'Remote',
          remoteOnly: data.profile.preferences?.remote_only || true,
        })
      }
    } catch (error) {
      console.log('Profile not found, using defaults')
    } finally {
      setLoading(false)
    }
  }

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
        experience_years: parseInt(formData.experience),
        location: formData.location,
        remote_only: formData.remoteOnly
      }

      await userApi.createOrUpdateProfile(profileData)
      alert('Profile saved successfully!')
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const handleStartScan = async () => {
    if (!user?.id) return

    setScanningLocal(true)
    setScanning(true)
    try {
      await jobsApi.triggerScan({
        clerk_user_id: user.id,
        sources: ['google_jobs', 'yc'],
        match_threshold: 0.5
      })
      alert('Job scan started! Check the Jobs page in a few moments.')
    } catch (error) {
      console.error('Error starting scan:', error)
      alert('Failed to start scan')
    } finally {
      setScanningLocal(false)
      setScanning(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

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
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
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

          {/* Skills */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Skills
            </label>
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

          {/* Experience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Years of Experience
            </label>
            <input
              type="number"
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Location Preferences */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., San Francisco, CA"
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

          {/* Resume Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resume
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500">PDF, DOC, or DOCX (max 5MB)</p>
              <input type="file" className="hidden" accept=".pdf,.doc,.docx" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {saving ? 'Saving...' : 'Save Profile'}
            </button>

            <button
              type="button"
              onClick={handleStartScan}
              disabled={scanning}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {scanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Briefcase className="w-5 h-5" />}
              {scanning ? 'Scanning...' : 'Start Job Hunt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
