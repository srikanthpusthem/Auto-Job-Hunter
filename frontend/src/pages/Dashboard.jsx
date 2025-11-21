import { useUser } from '@clerk/clerk-react'
import { Briefcase, TrendingUp, Clock, CheckCircle } from 'lucide-react'

export default function Dashboard() {
  const { user } = useUser()

  const stats = [
    { name: 'Total Jobs Scanned', value: '1,234', icon: Briefcase, color: 'bg-blue-500' },
    { name: 'Matched Jobs', value: '87', icon: CheckCircle, color: 'bg-green-500' },
    { name: 'Application Sent', value: '23', icon: TrendingUp, color: 'bg-purple-500' },
    { name: 'Pending Reviews', value: '12', icon: Clock, color: 'bg-orange-500' },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.firstName || 'there'}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here's what's happening with your job search
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.name}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">New job matches found</p>
              <p className="text-sm text-gray-600">5 new positions matching your profile</p>
            </div>
            <span className="text-sm text-gray-500">2h ago</span>
          </div>

          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Profile scanned successfully</p>
              <p className="text-sm text-gray-600">Your skills have been updated</p>
            </div>
            <span className="text-sm text-gray-500">5h ago</span>
          </div>
        </div>
      </div>
    </div>
  )
}
