// app/(platform)/platform/dashboard/page.tsx
import { prisma } from '@/lib/prisma'
import { 
  Building2, 
  Users, 
  CreditCard, 
  TrendingUp,
  Activity
} from 'lucide-react'

export default async function PlatformDashboardPage() {
  const [totalOrgs, totalUsers, activeSubscriptions, recentActivity] = await Promise.all([
    prisma.organization.count(),
    prisma.user.count(),
    prisma.organization.count({ where: { status: 'ACTIVE' } }),
    prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } }
    })
  ])

  const stats = [
    {
      name: 'Total Organizations',
      value: totalOrgs,
      icon: Building2,
      change: '+12%',
      changeType: 'positive'
    },
    {
      name: 'Total Users',
      value: totalUsers,
      icon: Users,
      change: '+23%',
      changeType: 'positive'
    },
    {
      name: 'Active Subscriptions',
      value: activeSubscriptions,
      icon: CreditCard,
      change: '+8%',
      changeType: 'positive'
    },
    {
      name: 'Monthly Revenue',
      value: '$12,450',
      icon: TrendingUp,
      change: '+15%',
      changeType: 'positive'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Overview of your entire platform
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <stat.icon className="h-6 w-6 text-blue-600" />
              </div>
              <span className={`text-sm font-medium ${
                stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change}
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mt-4">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-1">{stat.name}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="px-6 py-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <Activity className="h-5 w-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {activity.user?.name || activity.user?.email || 'System'}
                </p>
                <p className="text-sm text-gray-500">{activity.action}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">
                  {new Date(activity.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}