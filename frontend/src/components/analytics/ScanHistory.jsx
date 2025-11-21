import { CheckCircle, XCircle, Clock, PlayCircle } from 'lucide-react'

export default function ScanHistory({ scans }) {
  if (!scans?.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        No scan history available.
      </div>
    )
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'failed': return <XCircle className="w-5 h-5 text-red-500" />
      case 'running': return <PlayCircle className="w-5 h-5 text-blue-500 animate-pulse" />
      default: return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  return (
    <div className="overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Found
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              New
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Avg Score
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {scans.map((scan) => (
            <tr key={scan._id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  {getStatusIcon(scan.status)}
                  <span className={`text-sm font-medium capitalize ${
                    scan.status === 'completed' ? 'text-green-700' : 
                    scan.status === 'failed' ? 'text-red-700' : 'text-gray-700'
                  }`}>
                    {scan.status}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(scan.start_time).toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                {scan.jobs_found_count || 0}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                {scan.new_jobs_count || 0}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {scan.avg_score ? (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    scan.avg_score >= 80 ? 'bg-green-100 text-green-800' :
                    scan.avg_score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {Math.round(scan.avg_score)}%
                  </span>
                ) : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
