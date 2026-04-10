// app/org/[orgSlug]/dashboard/page.tsx
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { 
  Users, 
  Home, 
  Calendar, 
  TrendingUp,
  CreditCard,
  Plus,
  ArrowRight,
  ArrowUp,
  MoreHorizontal,
} from 'lucide-react'

// Force dynamic rendering - don't cache this page
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface DashboardPageProps {
  params: {
    orgSlug: string
  }
}

export default async function OrgDashboardPage({ params }: DashboardPageProps) {
  const organization = await prisma.organization.findUnique({
    where: { slug: params.orgSlug },
    include: {
      _count: {
        select: {
          memberships: true,
          houses: true,
          events: true,
        }
      },
      houses: {
        include: {
          _count: {
            select: {
              members: true,
              events: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 4,
      },
      memberships: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            }
          },
          houseMemberships: {
            include: {
              house: {
                select: { name: true, slug: true }
              }
            }
          }
        }
      },
      events: {
        where: {
          startDate: { gte: new Date() }
        },
        take: 5,
        orderBy: { startDate: 'asc' },
        include: {
          house: {
            select: { name: true, slug: true }
          }
        }
      },
      payments: {
        where: {
          status: 'SUCCEEDED',
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        },
        select: { amount: true }
      }
    }
  })

  if (!organization) {
    return <div>Organization not found</div>
  }

  const monthlyRevenue = organization.payments.reduce((sum, p) => sum + p.amount, 0)

  const stats = [
    {
      name: 'Total Members',
      value: organization._count.memberships,
      icon: Users,
      change: '+12%',
      trend: 'up',
      color: 'blue',
    },
    {
      name: 'Total Houses',
      value: organization._count.houses,
      icon: Home,
      change: '+5%',
      trend: 'up',
      color: 'green',
    },
    {
      name: 'Total Events',
      value: organization._count.events,
      icon: Calendar,
      change: '+8%',
      trend: 'up',
      color: 'purple',
    },
    {
      name: 'Monthly Revenue',
      value: `$${monthlyRevenue.toLocaleString()}`,
      icon: CreditCard,
      change: '+15%',
      trend: 'up',
      color: 'orange',
    },
  ]

  const colorClasses = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome back to {organization.name}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => {
          const colors = colorClasses[stat.color as keyof typeof colorClasses]
          
          return (
            <div key={stat.name} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center`}>
                  <stat.icon className={`h-6 w-6 ${colors.text}`} />
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium text-green-600`}>
                  <ArrowUp className="h-3 w-3" />
                  {stat.change}
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.name}</p>
            </div>
          )
        })}
      </div>

      {/* Houses Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Your Houses</h2>
            <p className="text-sm text-gray-500">Manage your houses and their content</p>
          </div>
          <Link
            href={`/org/${params.orgSlug}/houses`}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            View all houses
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {organization.houses.length === 0 ? (
            <div className="col-span-full bg-gray-50 rounded-xl border border-gray-200 p-12 text-center">
              <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No houses yet</h3>
              <p className="text-gray-500 mb-4">Create your first house to get started</p>
              <Link
                href={`/org/${params.orgSlug}/houses/create`}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Create House
              </Link>
            </div>
          ) : (
            <>
              {organization.houses.map((house) => (
                <Link
                  key={house.id}
                  href={`/org/${params.orgSlug}/houses/${house.slug}/dashboard`}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-300 transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                      <Home className="h-6 w-6 text-white" />
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 transition p-1.5 hover:bg-gray-100 rounded-lg">
                      <MoreHorizontal className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{house.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">{house.slug}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1.5 text-gray-600">
                      <Users className="h-4 w-4 text-gray-400" />
                      {house._count.members}
                    </span>
                    <span className="flex items-center gap-1.5 text-gray-600">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {house._count.events}
                    </span>
                  </div>
                </Link>
              ))}
              
              {organization.houses.length < 4 && (
                <Link
                  href={`/org/${params.orgSlug}/houses/create`}
                  className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-5 hover:bg-gray-100 hover:border-gray-400 transition-all flex flex-col items-center justify-center text-center"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
                    <Plus className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">Create New House</h3>
                  <p className="text-sm text-gray-500">Add another house to your organization</p>
                </Link>
              )}
            </>
          )}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Members */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Recent Members</h2>
              <p className="text-sm text-gray-500">Latest members who joined</p>
            </div>
            <Link
              href={`/org/${params.orgSlug}/members`}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View all
            </Link>
          </div>
          
          <div className="divide-y divide-gray-100">
            {organization.memberships.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No members yet</p>
              </div>
            ) : (
              organization.memberships.map((member) => (
                <div key={member.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50 transition">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                    {member.user.image ? (
                      <img src={member.user.image} alt="" className="w-10 h-10 rounded-full" />
                    ) : (
                      <span className="text-white text-sm font-medium">
                        {member.user.name?.[0] || member.user.email[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {member.user.name || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{member.user.email}</p>
                    {member.houseMemberships.length > 0 && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {member.houseMemberships.map(h => h.house.name).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Upcoming Events</h2>
              <p className="text-sm text-gray-500">Events scheduled in the near future</p>
            </div>
            <Link
              href={`/org/${params.orgSlug}/events`}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View all
            </Link>
          </div>
          
          <div className="divide-y divide-gray-100">
            {organization.events.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-3">No upcoming events</p>
                <Link
                  href={`/org/${params.orgSlug}/events/create`}
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Create your first event
                </Link>
              </div>
            ) : (
              organization.events.map((event) => (
                <Link
                  key={event.id}
                  href={`/org/${params.orgSlug}/houses/${event.house?.slug}/events/${event.id}`}
                  className="block px-5 py-3.5 hover:bg-gray-50 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{event.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {event.house?.name} • {new Date(event.startDate).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(event.startDate).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit',
                          hour12: true 
                        })}
                      </p>
                      {event.status === 'PUBLISHED' ? (
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                          Published
                        </span>
                      ) : (
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                          Draft
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link
          href={`/org/${params.orgSlug}/houses/create`}
          className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-blue-300 transition group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition">
              <Home className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Create House</p>
              <p className="text-xs text-gray-500">Add a new house</p>
            </div>
          </div>
        </Link>
        
        <Link
          href={`/org/${params.orgSlug}/events/create`}
          className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-purple-300 transition group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center group-hover:bg-purple-100 transition">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Create Event</p>
              <p className="text-xs text-gray-500">Schedule a new event</p>
            </div>
          </div>
        </Link>
        
        <Link
          href={`/org/${params.orgSlug}/members/invite`}
          className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-green-300 transition group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center group-hover:bg-green-100 transition">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Invite Members</p>
              <p className="text-xs text-gray-500">Add new members</p>
            </div>
          </div>
        </Link>
        
        <Link
          href={`/org/${params.orgSlug}/reports`}
          className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-orange-300 transition group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center group-hover:bg-orange-100 transition">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">View Reports</p>
              <p className="text-xs text-gray-500">Analytics & insights</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}