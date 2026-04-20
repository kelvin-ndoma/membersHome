// app/(platform)/platform/dashboard/page.tsx
import { prisma } from '@/lib/prisma'
import { Activity } from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import { ThemeCard } from '@/components/ui/ThemeCard'
import { ThemeBadge } from '@/components/ui/ThemeBadge'

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Overview of your entire platform
        </p>
      </div>

      {/* Stats Grid - Using string icon names */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          name="Total Organizations" 
          value={totalOrgs} 
          icon="Building2"  // String name!
          change="+12%" 
          changeType="positive"
          color="primary"
        />
        <StatCard 
          name="Total Users" 
          value={totalUsers} 
          icon="Users"  // String name!
          change="+23%" 
          changeType="positive"
          color="secondary"
        />
        <StatCard 
          name="Active Subscriptions" 
          value={activeSubscriptions} 
          icon="CreditCard"  // String name!
          change="+8%" 
          changeType="positive"
          color="accent"
        />
        <StatCard 
          name="Monthly Revenue" 
          value="$12,450" 
          icon="TrendingUp"  // String name!
          change="+15%" 
          changeType="positive"
          color="primary"
        />
      </div>

      {/* Recent Activity */}
      <ThemeCard title="Recent Activity" icon="Activity" color="primary">
        <div className="divide-y divide-gray-100 -mx-5 -mb-5">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <Activity className="h-4 w-4 text-gray-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {activity.user?.name || activity.user?.email || 'System'}
                </p>
                <p className="text-xs text-gray-500">{activity.action}</p>
              </div>
              <div className="text-right">
                <ThemeBadge variant="default" size="sm">
                  {new Date(activity.createdAt).toLocaleDateString()}
                </ThemeBadge>
              </div>
            </div>
          ))}
        </div>
      </ThemeCard>
    </div>
  )
}