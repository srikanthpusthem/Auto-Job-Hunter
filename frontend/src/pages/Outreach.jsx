import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/clerk-react'
import { Plus, Loader2, MessageSquare, Sparkles } from 'lucide-react'
import { outreachApi } from '../lib/api'
import TemplateList from '../components/outreach/TemplateList'
import TemplateEditor from '../components/outreach/TemplateEditor'

export default function Outreach() {
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [templates, setTemplates] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [currentTemplate, setCurrentTemplate] = useState(null)
  const [saving, setSaving] = useState(false)

  const loadTemplates = useCallback(async () => {
    if (!user?.id) return

    try {
      const data = await outreachApi.getTemplates(user.id)
      setTemplates(data)
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  const handleCreate = () => {
    setCurrentTemplate(null)
    setIsEditing(true)
  }

  const handleEdit = (template) => {
    setCurrentTemplate(template)
    setIsEditing(true)
  }

  const handleDelete = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return

    try {
      await outreachApi.deleteTemplate(templateId, user.id)
      setTemplates(prev => prev.filter(t => t._id !== templateId))
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('Failed to delete template')
    }
  }

  const handleSave = async (formData) => {
    setSaving(true)
    try {
      if (currentTemplate) {
        // Update
        const updated = await outreachApi.updateTemplate(currentTemplate._id, {
          ...formData,
          clerk_user_id: user.id
        })
        setTemplates(prev => prev.map(t => t._id === updated._id ? updated : t))
      } else {
        // Create
        const created = await outreachApi.createTemplate({
          ...formData,
          clerk_user_id: user.id
        })
        setTemplates(prev => [created, ...prev])
      }
      setIsEditing(false)
      setCurrentTemplate(null)
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Failed to save template')
    } finally {
      setSaving(false)
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Outreach Center</h1>
          <p className="text-gray-600 mt-1">Manage your message templates and personalization</p>
        </div>
        {!isEditing && (
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Template
          </button>
        )}
      </div>

      {/* Stats / Info Cards */}
      {!isEditing && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-gray-900">Total Templates</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">{templates.length}</p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-gray-900">AI Personalization</h3>
            </div>
            <p className="text-sm text-gray-600">
              Templates use AI to automatically fill in details like company name, hiring manager, and relevant skills.
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      {isEditing ? (
        <TemplateEditor
          key={currentTemplate?._id || 'new'}
          template={currentTemplate}
          onSave={handleSave}
          onCancel={() => {
            setIsEditing(false)
            setCurrentTemplate(null)
          }}
          saving={saving}
        />
      ) : (
        <TemplateList
          templates={templates}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
