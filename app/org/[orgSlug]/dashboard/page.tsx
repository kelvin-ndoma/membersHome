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
  MoreHorizontal,
} from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import { ThemeCard } from '@/components/ui/ThemeCard'
import { ThemeBadge } from '@/components/ui/ThemeBadge'
import { ThemeButton } from '@/components/ui/ThemeButton'

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

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Welcome back to {organization.name}
          </p>
        </div>
        <Link href={`/org/${params.orgSlug}/houses/create`}>
          <ThemeButton size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create House
          </ThemeButton>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          name="Total Members"
          value={organization._count.memberships}
          icon="Users"
          color="primary"
        />
        <StatCard
          name="Total Houses"
          value={organization._count.houses}
          icon="Home"
          color="secondary"
        />
        <StatCard
          name="Total Events"
          value={organization._count.events}
          icon="Calendar"
          color="accent"
        />
        <StatCard
          name="Monthly Revenue"
          value={`$${monthlyRevenue.toLocaleString()}`}
          icon="CreditCard"
          color="primary"
        />
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
            className="text-sm font-medium text-theme-primary hover:text-theme-secondary flex items-center gap-1 transition-colors"
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
              <Link href={`/org/${params.orgSlug}/houses/create`}>
                <ThemeButton>
                  <Plus className="h-4 w-4 mr-2" />
                  Create House
                </ThemeButton>
              </Link>
            </div>
          ) : (
            <>
              {organization.houses.map((house) => (
                <Link
                  key={house.id}
                  href={`/org/${params.orgSlug}/houses/${house.slug}/dashboard`}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-theme-primary/30 transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ 
                        background: `linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-secondary) 100%)` 
                      }}
                    >
                      <Home className="h-6 w-6 text-white" />
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 transition p-1.5 hover:bg-gray-100 rounded-lg">
                      <MoreHorizontal className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-theme-primary transition-colors">
                    {house.name}
                  </h3>
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
                  className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-5 hover:bg-gray-100 hover:border-theme-primary/30 transition-all flex flex-col items-center justify-center text-center group"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-theme-primary/10 transition-colors">
                    <Plus className="h-6 w-6 text-gray-400 group-hover:text-theme-primary transition-colors" />
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
        <ThemeCard title="Recent Members" icon="Users" color="primary">
          <div className="-mx-5 -mb-5">
            <div className="px-5 pb-4">
              <Link
                href={`/org/${params.orgSlug}/members`}
                className="text-sm text-theme-primary hover:text-theme-secondary transition-colors"
              >
                View all members →
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
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-medium"
                      style={{ 
                        background: `linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-secondary) 100%)` 
                      }}
                    >
                      {member.user.image ? (
                        <img src={member.user.image} alt="" className="w-10 h-10 rounded-full" />
                      ) : (
                        member.user.name?.[0] || member.user.email[0].toUpperCase()
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
        </ThemeCard>

        {/* Upcoming Events */}
        <ThemeCard title="Upcoming Events" icon="Calendar" color="secondary">
          <div className="-mx-5 -mb-5">
            <div className="px-5 pb-4">
              <Link
                href={`/org/${params.orgSlug}/events`}
                className="text-sm text-theme-primary hover:text-theme-secondary transition-colors"
              >
                View all events →
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {organization.events.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-3">No upcoming events</p>
                  <Link
                    href={`/org/${params.orgSlug}/events/create`}
                    className="inline-flex items-center gap-1 text-sm text-theme-primary hover:text-theme-secondary"
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
                        <ThemeBadge 
                          variant={event.status === 'PUBLISHED' ? 'success' : 'warning'} 
                          size="sm"
                        >
                          {event.status}
                        </ThemeBadge>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </ThemeCard>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <QuickActionCard
          href={`/org/${params.orgSlug}/houses/create`}
          icon={Home}
          title="Create House"
          description="Add a new house"
          color="primary"
        />
        <QuickActionCard
          href={`/org/${params.orgSlug}/events/create`}
          icon={Calendar}
          title="Create Event"
          description="Schedule a new event"
          color="secondary"
        />
        <QuickActionCard
          href={`/org/${params.orgSlug}/members/invite`}
          icon={Users}
          title="Invite Members"
          description="Add new members"
          color="accent"
        />
        <QuickActionCard
          href={`/org/${params.orgSlug}/reports`}
          icon={TrendingUp}
          title="View Reports"
          description="Analytics & insights"
          color="primary"
        />
      </div>
    </div>
  )
}

// Quick Action Card Component
function QuickActionCard({ 
  href, 
  icon: Icon, 
  title, 
  description, 
  color 
}: { 
  href: string
  icon: any
  title: string
  description: string
  color: 'primary' | 'secondary' | 'accent'
}) {
  const colorClasses = {
    primary: 'bg-theme-primary/10 text-theme-primary group-hover:bg-theme-primary group-hover:text-white',
    secondary: 'bg-theme-secondary/10 text-theme-secondary group-hover:bg-theme-secondary group-hover:text-white',
    accent: 'bg-theme-accent/10 text-theme-accent group-hover:bg-theme-accent group-hover:text-white',
  }

  const borderClasses = {
    primary: 'hover:border-theme-primary/30',
    secondary: 'hover:border-theme-secondary/30',
    accent: 'hover:border-theme-accent/30',
  }

  return (
    <Link
      href={href}
      className={`bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all group ${borderClasses[color]}`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium text-gray-900">{title}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
    </Link>
  )
}