"use client"

import { useEffect, useState } from "react"

interface AnalyticsData {
  totalOrganizations: number
  totalUsers: number
  totalMemberships: number
  totalRevenue: number
  monthlyGrowth: {
    month: string
    users: number
    organizations: number
  }[]
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/platform/stats")
      const stats = await response.json()
      setData(stats)
    } catch (error) {
      console.error("Failed to fetch analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Platform Analytics</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">Total Organizations</p>
          <p className="text-2xl font-bold text-gray-900">{data?.totalOrganizations || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="text-2xl font-bold text-gray-900">{data?.totalUsers || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">Total Memberships</p>
          <p className="text-2xl font-bold text-gray-900">{data?.totalMemberships || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-900">
            ${((data?.totalRevenue || 0) / 100).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Coming Soon Message */}
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <div className="text-6xl mb-4">📈</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Advanced Analytics Coming Soon</h2>
        <p className="text-gray-500">
          Detailed charts, graphs, and insights are currently under development.
        </p>
      </div>
    </div>
  )
}