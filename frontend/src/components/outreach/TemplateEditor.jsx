import { useState, useEffect } from 'react'
import { X, Save, Loader2, Info } from 'lucide-react'

export default function TemplateEditor({ template, onSave, onCancel, saving }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'initial',
    subject: '',
    body: ''
  })

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || '',
        type: template.type || 'initial',
        subject: template.subject || '',
        body: template.body || ''
      })
    }
  }, [template])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  const insertVariable = (variable) => {
    const textarea = document.getElementById('template-body')
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = formData.body
    const newText = text.substring(0, start) + variable + text.substring(end)
    
    setFormData(prev => ({ ...prev, body: newText }))
    
    // Restore focus and cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + variable.length, start + variable.length)
    }, 0)
  }

  const variables = [
    { label: 'Company Name', value: '{{company_name}}' },
    { label: 'Job Title', value: '{{job_title}}' },
    { label: 'Hiring Manager', value: '{{hiring_manager}}' },
    { label: 'My Name', value: '{{my_name}}' },
    { label: 'My Skills', value: '{{my_skills}}' },
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">
          {template ? 'Edit Template' : 'New Template'}
        </h2>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Startup CEO Outreach"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="initial">Initial Outreach</option>
              <option value="followup">Follow-up</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject Line
          </label>
          <input
            type="text"
            value={formData.subject}
            onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
            placeholder="Subject line for email..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Message Body
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Insert variable:</span>
              {variables.map(v => (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => insertVariable(v.value)}
                  className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border border-gray-200 transition-colors"
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
          <textarea
            id="template-body"
            required
            value={formData.body}
            onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
            rows={12}
            placeholder="Hi {{hiring_manager}}, I saw you're looking for a {{job_title}}..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          />
          <div className="flex items-start gap-2 mt-2 text-xs text-gray-500">
            <Info className="w-4 h-4 flex-shrink-0" />
            <p>
              Use variables like <code>{`{{company_name}}`}</code> to automatically personalize messages.
              The AI will fill these in when generating outreach.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-50 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Template
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
