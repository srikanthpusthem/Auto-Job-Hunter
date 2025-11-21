import { Zap, Plus, Play, Pause } from 'lucide-react'

export default function Automations() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Automations</h1>
          <p className="text-gray-600 mt-1">Create triggers and actions to automate your job hunt</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          Create Automation
        </button>
      </div>

      <div className="grid gap-6">
        {/* Example Automation Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">High Match Notification</h3>
                <p className="text-sm text-gray-500">Runs when a new job is matched</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">Active</span>
              <button className="text-gray-400 hover:text-gray-600">
                <Pause className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            <span className="font-medium">IF</span>
            <span className="bg-white px-2 py-1 rounded border">Match Score ≥ 80%</span>
            <span className="font-medium">THEN</span>
            <span className="bg-white px-2 py-1 rounded border">Send Email Notification</span>
          </div>
        </div>
      </div>
    </div>
  )
}

