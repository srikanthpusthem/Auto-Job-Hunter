import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'

export default function Analytics() {
  const data = [
    { name: 'Mon', score: 65 },
    { name: 'Tue', score: 72 },
    { name: 'Wed', score: 68 },
    { name: 'Thu', score: 85 },
    { name: 'Fri', score: 78 },
    { name: 'Sat', score: 82 },
    { name: 'Sun', score: 90 },
  ]

  const sourceData = [
    { name: 'Google Jobs', value: 400 },
    { name: 'LinkedIn', value: 300 },
    { name: 'YC', value: 300 },
    { name: 'Indeed', value: 200 },
  ]

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">Insights into your job search performance</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Match Score Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Match Score Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Source Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Job Source Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-6">
        <h3 className="text-lg font-semibold text-indigo-900 mb-4">AI Insights</h3>
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-indigo-800">
            <span className="text-xl">📈</span>
            Your average match score increased by 18% this week.
          </p>
          <p className="flex items-center gap-2 text-indigo-800">
            <span className="text-xl">🎯</span>
            Backend + AI jobs dominate your matches this month.
          </p>
        </div>
      </div>
    </div>
  )
}

