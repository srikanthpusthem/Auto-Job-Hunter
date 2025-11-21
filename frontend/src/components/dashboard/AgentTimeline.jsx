import { useAgentTimeline, useAgentStatus } from '../../services/runService'
import { useUser } from '@clerk/clerk-react'
import { formatDistanceToNow } from 'date-fns'

export default function AgentTimeline() {
  const { user } = useUser()
  const { data: timeline } = useAgentTimeline(user?.id)
  const { data: statusData } = useAgentStatus()
  const isRunning = statusData?.status === 'running'

  if (!isRunning && (!timeline || timeline.length === 0)) {
    return null
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
          {isRunning ? 'Live Agent Activity' : 'Recent Activity Log'}
        </h3>
      </div>
      <div className="p-6 bg-slate-50 max-h-96 overflow-y-auto">
        <div className="space-y-4">
          {timeline?.map((item, index) => (
            <TimelineItem 
              key={index}
              status={index === 0 && isRunning ? 'active' : 'completed'}
              text={item.step}
              time={item.timestamp ? formatDistanceToNow(new Date(item.timestamp)) + ' ago' : ''}
            />
          ))}
          {isRunning && timeline?.length === 0 && (
            <TimelineItem 
              status="active" 
              text="Initializing agent..." 
              time="Just now" 
            />
          )}
        </div>
      </div>
    </div>
  )
}

function TimelineItem({ status, text, time }) {
  return (
    <div className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col items-center">
        <div className={`w-2 h-2 rounded-full mt-2 ${
          status === 'completed' ? 'bg-green-500' :
          status === 'active' ? 'bg-blue-500 animate-pulse' :
          'bg-gray-300'
        }`} />
        {status !== 'last' && <div className="w-0.5 h-6 bg-gray-200 my-1" />}
      </div>
      <div className={`${status === 'pending' ? 'text-gray-400' : 'text-gray-700'} text-sm flex-1 flex justify-between`}>
        <span>{text}</span>
        {time && <span className="text-xs text-gray-400">{time}</span>}
      </div>
    </div>
  )
}
