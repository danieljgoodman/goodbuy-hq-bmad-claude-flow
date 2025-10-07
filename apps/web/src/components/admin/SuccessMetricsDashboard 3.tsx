'use client'

export default function SuccessMetricsDashboard() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Success Metrics Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded">
            <h3 className="text-lg font-medium text-blue-900">Total Users</h3>
            <p className="text-2xl font-bold text-blue-600">0</p>
            <p className="text-xs text-blue-500 mt-1">Real metrics coming soon</p>
          </div>
          <div className="bg-green-50 p-4 rounded">
            <h3 className="text-lg font-medium text-green-900">Evaluations</h3>
            <p className="text-2xl font-bold text-green-600">0</p>
            <p className="text-xs text-green-500 mt-1">Real metrics coming soon</p>
          </div>
          <div className="bg-purple-50 p-4 rounded">
            <h3 className="text-lg font-medium text-purple-900">Premium Users</h3>
            <p className="text-2xl font-bold text-purple-600">0</p>
            <p className="text-xs text-purple-500 mt-1">Real metrics coming soon</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Coming soon - real-time metrics and analytics</p>
        </div>
      </div>
    </div>
  )
}
