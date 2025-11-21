import { Edit2, Trash2, FileText, Send } from 'lucide-react'

export default function TemplateList({ templates, onEdit, onDelete }) {
  if (!templates?.length) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No templates yet</h3>
        <p className="text-gray-500 mt-1">Create your first outreach template to get started</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {templates.map((template) => (
        <div
          key={template._id}
          className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg ${
                template.type === 'initial' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
              }`}>
                <Send className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{template.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    template.type === 'initial' 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'bg-purple-50 text-purple-700'
                  }`}>
                    {template.type === 'initial' ? 'Initial Outreach' : 'Follow-up'}
                  </span>
                  <span className="text-xs text-gray-500">
                    Updated {new Date(template.updated_at || template.created_at).toLocaleDateString()}
                  </span>
                </div>
                {template.subject && (
                  <p className="text-sm text-gray-600 mt-3 font-medium">
                    Subject: <span className="font-normal">{template.subject}</span>
                  </p>
                )}
                <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                  {template.body}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit(template)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit template"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(template._id)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete template"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
