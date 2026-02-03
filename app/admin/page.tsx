// app/admin/page.tsx
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import {
  Building,
  Users,
  Home,
  Settings,
  CreditCard,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';

export default async function AdminDashboard() {
  const session = await getServerSession();
  
  if (!session?.user?.email) {
    redirect('/');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { platformRole: true },
  });

  if (!user || user.platformRole !== 'PLATFORM_ADMIN') {
    redirect('/');
  }

  // Get platform statistics
  const [
    totalOrganizations,
    totalUsers,
    totalHouses,
    activeOrganizations,
    pendingPayments,
    recentOrganizations,
    recentActivities
  ] = await Promise.all([
    prisma.organization.count(),
    prisma.user.count(),
    prisma.house.count(),
    prisma.organization.count({ where: { status: 'ACTIVE' } }),
    prisma.payment.count({ where: { status: 'PENDING' } }),
    prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        createdAt: true,
        _count: {
          select: { memberships: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.auditLog.findMany({
      where: {
        OR: [
          { action: { contains: 'CREATE' } },
          { action: { contains: 'UPDATE' } },
          { action: { contains: 'DELETE' } },
        ]
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        organization: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Platform Administration</h1>
            <p className="mt-2 text-purple-100">
              Welcome back! Manage your entire platform from here.
            </p>
          </div>
          <div className="hidden md:block">
            <div className="text-sm">
              <div className="flex items-center space-x-4">
                <span className="bg-purple-500 px-3 py-1 rounded-full">
                  Platform Admin
                </span>
                <span>Last login: Today</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Organizations</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {totalOrganizations}
              </p>
              <p className="text-sm text-green-600 mt-1">
                {activeOrganizations} active
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Building className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {totalUsers}
              </p>
              <p className="text-sm text-gray-500 mt-1">Across all organizations</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Houses</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {totalHouses}
              </p>
              <p className="text-sm text-gray-500 mt-1">Sub-communities</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Home className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {pendingPayments}
              </p>
              <p className="text-sm text-yellow-600 mt-1">Payments pending</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <CreditCard className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Organizations */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Organizations
              </h2>
              <Link
                href="/admin/organizations"
                className="text-sm text-purple-600 hover:text-purple-700"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="divide-y">
            {recentOrganizations.map((org) => (
              <div key={org.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <Link
                      href={`/admin/organizations/${org.slug}`}
                      className="font-medium text-gray-900 hover:text-purple-600"
                    >
                      {org.name}
                    </Link>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                      <span>{org._count.memberships} members</span>
                      <span>•</span>
                      <span>{org.plan} plan</span>
                      <span>•</span>
                      <span>{new Date(org.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      org.plan === 'ENTERPRISE' ? 'bg-purple-100 text-purple-800' :
                      org.plan === 'PROFESSIONAL' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {org.plan}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Platform Activity
            </h2>
          </div>
          <div className="divide-y max-h-[400px] overflow-y-auto">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    {activity.action.includes('CREATE') ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : activity.action.includes('DELETE') ? (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    ) : (
                      <TrendingUp className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm text-gray-900">
                      {activity.action.replace('_', ' ').toLowerCase()}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                      {activity.user && (
                        <span>{activity.user.name || activity.user.email}</span>
                      )}
                      {activity.organization && (
                        <span>• {activity.organization.name}</span>
                      )}
                      <span>• {new Date(activity.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Access */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Access
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/organizations/create"
            className="bg-purple-50 border border-purple-200 rounded-lg p-4 hover:bg-purple-100 hover:border-purple-300 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Building className="h-5 w-5 text-purple-600" />
              <div>
                <h3 className="font-medium text-gray-900">Create Organization</h3>
                <p className="text-sm text-gray-600">For new clients</p>
              </div>
            </div>
          </Link>
          <Link
            href="/admin/billing"
            className="bg-blue-50 border border-blue-200 rounded-lg p-4 hover:bg-blue-100 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="font-medium text-gray-900">Billing</h3>
                <p className="text-sm text-gray-600">Manage payments & invoices</p>
              </div>
            </div>
          </Link>
          <Link
            href="/admin/settings"
            className="bg-green-50 border border-green-200 rounded-lg p-4 hover:bg-green-100 hover:border-green-300 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Settings className="h-5 w-5 text-green-600" />
              <div>
                <h3 className="font-medium text-gray-900">Platform Settings</h3>
                <p className="text-sm text-gray-600">Configure global settings</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}