import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { Save, Loader2, CheckCircle } from 'lucide-react'
import { userApi } from '../lib/api'

export default function Settings() {
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [profile, setProfile] = useState(null)
  
  const [settings, setSettings] = useState({
    aggressiveness: 'normal',
    role_focus: [],
    remote_only: false,
    exclude_faang: false,
    target_startups: false,
    salary_min: '',
    run_schedule: 'daily',
    outreach_style: 'neutral',
  })

  useEffect(() => {
    if (user?.id) {
      loadSettings()
    }
  }, [user])

  const loadSettings = async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const data = await userApi.getProfile(user.id)
      setProfile(data)
      
      if (data.profile) {
        const prefs = data.profile.preferences || {}
        setSettings({
          aggressiveness: prefs.aggressiveness || 'normal',
          role_focus: prefs.role_focus || [],
          remote_only: prefs.remote_only || false,
          exclude_faang: prefs.exclude_faang || false,
          target_startups: prefs.target_startups || false,
          salary_min: prefs.salary_min?.toString() || '',
          run_schedule: prefs.run_schedule || 'daily',
          outreach_style: prefs.outreach_style || 'neutral',
        })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user?.id || !profile) return
    
    setSaving(true)
    setSaved(false)
    try {
      const updatedProfile = {
        ...profile.profile,
        preferences: {
          ...profile.profile.preferences,
          aggressiveness: settings.aggressiveness,
          role_focus: settings.role_focus,
          remote_only: settings.remote_only,
          exclude_faang: settings.exclude_faang,
          target_startups: settings.target_startups,
          salary_min: settings.salary_min ? parseFloat(settings.salary_min) : null,
          run_schedule: settings.run_schedule,
          outreach_style: settings.outreach_style,
        }
      }

      await userApi.createOrUpdateProfile({
        clerk_user_id: user.id,
        name: profile.profile.name || user.fullName || 'User',
        email: user.primaryEmailAddress?.emailAddress || '',
        skills: profile.profile.skills || [],
        keywords: profile.profile.keywords || [],
        summary: profile.profile.summary,
        experience_years: profile.profile.experience_years || 0,
        linkedin_url: profile.profile.linkedin_url,
        location: profile.profile.preferences?.location,
        ...updatedProfile.preferences
      })

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const toggleRoleFocus = (role) => {
    setSettings(prev => ({
      ...prev,
      role_focus: prev.role_focus.includes(role)
        ? prev.role_focus.filter(r => r !== role)
        : [...prev.role_focus, role]
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const roleOptions = ['AI Engineer', 'Backend', 'Fullstack', 'DevOps', 'Data Engineer', 'Frontend', 'Mobile']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agent Settings</h1>
          <p className="text-gray-600 mt-1">Configure how your AI agent behaves</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <CheckCircle className="w-5 h-5" />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Settings
            </>
          )}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-8">
        {/* Aggressiveness */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Agent Aggressiveness</h3>
          <p className="text-sm text-gray-600 mb-4">Control how aggressively the agent searches and matches jobs</p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { id: 'conservative', label: 'Conservative', desc: 'High precision, fewer matches', threshold: 0.85 },
              { id: 'normal', label: 'Normal', desc: 'Balanced approach', threshold: 0.7 },
              { id: 'rapid-fire', label: 'Rapid Fire', desc: 'Maximum volume, lower threshold', threshold: 0.6 }
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setSettings(prev => ({ ...prev, aggressiveness: mode.id }))}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  settings.aggressiveness === mode.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold capitalize text-gray-900 mb-1">{mode.label}</div>
                <div className="text-sm text-gray-500 mb-2">{mode.desc}</div>
                <div className="text-xs text-gray-400">Match threshold: {Math.round(mode.threshold * 100)}%</div>
              </button>
            ))}
          </div>
        </div>

        {/* Role Focus */}
        <div className="border-t pt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Role Focus</h3>
          <p className="text-sm text-gray-600 mb-4">Prioritize specific job types</p>
          <div className="flex flex-wrap gap-2">
            {roleOptions.map(role => (
              <button
                key={role}
                onClick={() => toggleRoleFocus(role)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  settings.role_focus.includes(role)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="border-t pt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Filters</h3>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.remote_only}
                onChange={(e) => setSettings(prev => ({ ...prev, remote_only: e.target.checked }))}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <span className="font-medium text-gray-900">Remote Only</span>
                <p className="text-sm text-gray-500">Only show remote positions</p>
              </div>
            </label>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.exclude_faang}
                onChange={(e) => setSettings(prev => ({ ...prev, exclude_faang: e.target.checked }))}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <span className="font-medium text-gray-900">Exclude FAANG</span>
                <p className="text-sm text-gray-500">Hide jobs from large tech companies</p>
              </div>
            </label>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.target_startups}
                onChange={(e) => setSettings(prev => ({ ...prev, target_startups: e.target.checked }))}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <span className="font-medium text-gray-900">Target Startups</span>
                <p className="text-sm text-gray-500">Prioritize early-stage companies</p>
              </div>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Salary (USD/year)</label>
              <input
                type="number"
                value={settings.salary_min}
                onChange={(e) => setSettings(prev => ({ ...prev, salary_min: e.target.value }))}
                placeholder="e.g., 120000"
                className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Run Schedule */}
        <div className="border-t pt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Scan Schedule</h3>
          <div className="flex flex-wrap gap-4">
            {[
              { id: 'daily', label: 'Daily (6 AM)', desc: 'Once per day' },
              { id: 'twice-daily', label: 'Twice Daily', desc: '6 AM & 2 PM' },
              { id: 'weekly', label: 'Weekly', desc: 'Every Monday' },
              { id: 'manual', label: 'Manual Only', desc: 'Run scans manually' }
            ].map(schedule => (
              <label key={schedule.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="schedule"
                  value={schedule.id}
                  checked={settings.run_schedule === schedule.id}
                  onChange={(e) => setSettings(prev => ({ ...prev, run_schedule: e.target.value }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <span className="font-medium text-gray-900">{schedule.label}</span>
                  <p className="text-xs text-gray-500">{schedule.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Outreach Style */}
        <div className="border-t pt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Outreach Style</h3>
          <p className="text-sm text-gray-600 mb-4">Tone of generated outreach messages</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { id: 'warm', label: 'Warm', desc: 'Friendly & personal' },
              { id: 'neutral', label: 'Neutral', desc: 'Professional' },
              { id: 'confident', label: 'Confident', desc: 'Assertive' },
              { id: 'direct', label: 'Direct', desc: 'Straightforward' }
            ].map(style => (
              <button
                key={style.id}
                onClick={() => setSettings(prev => ({ ...prev, outreach_style: style.id }))}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  settings.outreach_style === style.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900 text-sm">{style.label}</div>
                <div className="text-xs text-gray-500 mt-1">{style.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
