import { Mail, MessageSquare, Send, Copy } from 'lucide-react'

export default function Outreach() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Outreach Center</h1>
        <p className="text-gray-600 mt-1">Manage your communication templates and strategy</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Templates List */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-4 px-2">Templates</h3>
          <div className="space-y-2">
            <button className="w-full text-left px-4 py-3 bg-blue-50 text-blue-700 rounded-lg font-medium flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Cold Email - Standard
            </button>
            <button className="w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-700 rounded-lg font-medium flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              LinkedIn Connection
            </button>
            <button className="w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-700 rounded-lg font-medium flex items-center gap-2">
              <Send className="w-4 h-4" />
              Follow-up (3 Days)
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Template Name</label>
            <input 
              type="text" 
              defaultValue="Cold Email - Standard"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject Line</label>
            <input 
              type="text" 
              defaultValue="Regarding {job_title} role at {company}"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
            <textarea 
              rows={10}
              defaultValue="Hi {hiring_manager},&#10;&#10;I noticed you're looking for a {job_title}..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium">
              <Copy className="w-4 h-4" />
              Duplicate
            </button>
            <button className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

