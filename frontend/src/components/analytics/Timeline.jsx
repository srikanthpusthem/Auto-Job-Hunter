import { Activity, CheckCircle, Search, FileText, Send, User, AlertCircle } from 'lucide-react'

export default function Timeline({ logs }) {
  if (!logs?.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        No activity recorded yet.
      </div>
    )
  }

  const getIcon = (agentName) => {
    switch (agentName?.toLowerCase()) {
      case 'scout': return Search
      case 'matcher': return CheckCircle
      case 'profiler': return User
      case 'outreach': return Send
      case 'supervisor': return Activity
      default: return FileText
    }
  }

  const getColor = (agentName) => {
    switch (agentName?.toLowerCase()) {
      case 'scout': return 'text-blue-600 bg-blue-100'
      case 'matcher': return 'text-green-600 bg-green-100'
      case 'profiler': return 'text-purple-600 bg-purple-100'
      case 'outreach': return 'text-orange-600 bg-orange-100'
      case 'supervisor': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {logs.map((log, logIdx) => {
          const Icon = getIcon(log.agent_name)
          const colorClass = getColor(log.agent_name)
          
          return (
            <li key={log._id || logIdx}>
              <div className="relative pb-8">
                {logIdx !== logs.length - 1 ? (
                  <span
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                ) : null}
                <div className="relative flex space-x-3">
                  <div>
                    <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${colorClass}`}>
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                    <div>
                      <p className="text-sm text-gray-500">
                        <span className="font-medium text-gray-900">{log.agent_name}</span>{' '}
                        {log.step_name}
                      </p>
                      {log.details && (
                        <p className="mt-1 text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded border border-gray-100">
                          {typeof log.details === 'string' 
                            ? log.details 
                            : JSON.stringify(log.details, null, 2).slice(0, 200) + (JSON.stringify(log.details).length > 200 ? '...' : '')}
                        </p>
                      )}
                    </div>
                    <div className="whitespace-nowrap text-right text-xs text-gray-500">
                      <time dateTime={log.timestamp}>
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </time>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
