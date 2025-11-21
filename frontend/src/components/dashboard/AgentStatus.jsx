import { Clock, Play, Pause, CheckCircle, Search, Target, Zap } from 'lucide-react'
import { useUser } from '@clerk/clerk-react'
import { 
  useAgentStatus, useNextScan, useLastScan, useToggleAutoScan,
  useStartRun, useStopRun 
} from '../../services/runService'
import { formatDistanceToNow } from 'date-fns'

export default function AgentStatus() {
  const { user } = useUser()
  const { data: statusData } = useAgentStatus()
  const { data: nextScanData } = useNextScan()
  const { data: lastScanData } = useLastScan()
  const { mutate: toggleAutoScan } = useToggleAutoScan()
  const { mutate: startRun, isPending: isStarting } = useStartRun()
  const { mutate: stopRun, isPending: isStopping } = useStopRun()
  
  const status = statusData?.status || 'idle'
  const nextScan = nextScanData?.next_scan
  const lastScan = lastScanData?.last_scan
  const jobsScanned = lastScanData?.jobs_scanned || 0
  
  // TODO: Get actual auto-scan status from user profile
  const autoScanEnabled = true 

  const handleToggleAutoScan = () => {
    if (user?.id) {
      toggleAutoScan({ enabled: !autoScanEnabled, clerkUserId: user.id })
    }
  }

  const handleStart = () => {
    if (user?.id) {
      startRun(user.id)
    }
  }

  const handleStop = () => {
    if (user?.id) {
      stopRun(user.id)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">JobHunter AI</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${
              status === 'running' 
                ? 'bg-green-50 text-green-700 border-green-200' 
                : status === 'paused'
                ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                : 'bg-gray-100 text-gray-600 border-gray-200'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                status === 'running' ? 'bg-green-500 animate-pulse' : 
                status === 'paused' ? 'bg-yellow-500' : 'bg-gray-400'
              }`} />
              {status === 'running' ? 'Running' : status === 'paused' ? 'Paused' : 'Idle'}
            </span>
          </div>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Next scan: {nextScan ? new Date(nextScan).toLocaleString() : 'Tomorrow at 6:00 AM'}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
            <span className="text-sm font-medium text-gray-700">Daily Auto-Scan</span>
            <button 
              onClick={handleToggleAutoScan}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoScanEnabled ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                autoScanEnabled ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
          
          {status === 'running' ? (
            <button 
              onClick={handleStop}
              disabled={isStopping}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 font-medium rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              <Pause className="w-4 h-4" />
              {isStopping ? 'Stopping...' : 'Stop Agent'}
            </button>
          ) : (
            <button 
              onClick={handleStart}
              disabled={isStarting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200 disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              {isStarting ? 'Starting...' : 'Run Now'}
            </button>
          )}
        </div>
      </div>
      
      {/* Last Scan Summary */}
      {status !== 'running' && lastScan && (
        <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>Last scan completed {formatDistanceToNow(new Date(lastScan))} ago</span>
          </div>
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-600" />
            <span>{jobsScanned} jobs analyzed</span>
          </div>
        </div>
      )}
    </div>
  )
}
