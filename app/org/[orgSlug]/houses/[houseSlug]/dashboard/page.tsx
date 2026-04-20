// app/org/[orgSlug]/houses/[houseSlug]/dashboard/page.tsx
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { 
  Users, 
  Calendar, 
  Ticket, 
  TrendingUp,
  Plus,
  ArrowRight,
  Eye,
  ExternalLink,
} from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import { ThemeCard } from '@/components/ui/ThemeCard'
import { ThemeBadge } from '@/components/ui/ThemeBadge'
import { ThemeButton } from '@/components/ui/ThemeButton'

interface HouseDashboardPageProps {
  params: {
    orgSlug: string
    houseSlug: string
  }
}

export default async function HouseDashboardPage({ params }: HouseDashboardPageProps) {
  const house = await prisma.house.findFirst({
    where: {
      slug: params.houseSlug,
      organization: { slug: params.orgSlug }
    },
    include: {
      _count: {
        select: {
          members: true,
          events: true,
          tickets: true,
        }
      },
      members: {
        take: 5,
        orderBy: { joinedAt: 'desc' },
        include: {
          membership: {
            include: {
              user: {
                select: { id: true, name: true, email: true, image: true }
              }
            }
          }
        }
      },
      events: {
        where: { startDate: { gte: new Date() } },
        take: 5,
        orderBy: { startDate: 'asc' },
      },
      organization: {
        select: { name: true, slug: true }
      }
    }
  })

  if (!house) {
    return <div>House not found</div>
  }

  const stats = [
    { name: 'Total Members', value: house._count.members, icon: 'Users', color: 'primary' as const },
    { name: 'Events', value: house._count.events, icon: 'Calendar', color: 'secondary' as const },
    { name: 'Tickets Sold', value: house._count.tickets, icon: 'Ticket', color: 'accent' as const },
    { name: 'Engagement', value: '78%', icon: 'TrendingUp', color: 'primary' as const },
  ]

  return (
    <div className="space-y-6">
      {/* Header with Portal Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{house.name} Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            {house.organization.name} • {house.description || 'No description'}
          </p>
        </div>
        
        {/* Portal Access Button */}
        <Link
          href={`/portal/${params.houseSlug}/dashboard`}
          target="_blank"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-theme-accent bg-theme-accent/10 rounded-lg hover:bg-theme-accent/20 transition border border-theme-accent/20"
        >
          <Eye className="h-4 w-4" />
          View Member Portal
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      {/* Stats - Using StatCard component with theme colors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.name}
            name={stat.name}
            value={stat.value}
            icon={stat.icon as any}
            color={stat.color}
          />
        ))}
      </div>

      {/* Quick Actions - Using theme colors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickActionCard
          href={`/org/${params.orgSlug}/houses/${params.houseSlug}/members`}
          icon={Users}
          title="Manage Members"
          description="View and manage house members"
          color="primary"
        />
        
        <QuickActionCard
          href={`/org/${params.orgSlug}/houses/${params.houseSlug}/events/create`}
          icon={Calendar}
          title="Create Event"
          description="Schedule a new event"
          color="secondary"
        />
        
        <QuickActionCard
          href={`/org/${params.orgSlug}/houses/${params.houseSlug}/tickets/create`}
          icon={Ticket}
          title="Create Ticket"
          description="Set up ticket types for events"
          color="accent"
        />
      </div>

      {/* Recent Members & Upcoming Events using ThemeCard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Members */}
        <ThemeCard title="Recent Members" icon="Users" color="primary">
          <div className="-mx-5 -mb-5">
            <div className="px-5 pb-4">
              <Link
                href={`/org/${params.orgSlug}/houses/${params.houseSlug}/members`}
                className="text-sm text-theme-primary hover:text-theme-secondary transition-colors"
              >
                View all members →
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {house.members.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No members yet</p>
                </div>
              ) : (
                house.members.map((member) => (
                  <div key={member.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50 transition">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-medium bg-gradient-to-br from-theme-primary to-theme-secondary">
                      {member.membership.user.image ? (
                        <img src={member.membership.user.image} alt="" className="w-10 h-10 rounded-full" />
                      ) : (
                        member.membership.user.name?.[0] || member.membership.user.email[0].toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {member.membership.user.name || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{member.membership.user.email}</p>
                    </div>
                    <ThemeBadge 
                      variant={
                        member.role === 'HOUSE_MANAGER' ? 'secondary' :
                        member.role === 'HOUSE_ADMIN' ? 'primary' : 'default'
                      }
                      size="sm"
                    >
                      {member.role === 'HOUSE_MANAGER' ? 'Manager' : 
                       member.role === 'HOUSE_ADMIN' ? 'Admin' : 'Member'}
                    </ThemeBadge>
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
                href={`/org/${params.orgSlug}/houses/${params.houseSlug}/events/create`}
                className="text-sm text-theme-primary hover:text-theme-secondary flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                Create Event
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {house.events.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-3">No upcoming events</p>
                  <Link
                    href={`/org/${params.orgSlug}/houses/${params.houseSlug}/events/create`}
                    className="inline-flex items-center gap-1 text-sm text-theme-primary hover:text-theme-secondary"
                  >
                    <Plus className="h-4 w-4" />
                    Create your first event
                  </Link>
                </div>
              ) : (
                house.events.map((event) => (
                  <Link
                    key={event.id}
                    href={`/org/${params.orgSlug}/houses/${params.houseSlug}/events/${event.id}`}
                    className="block px-5 py-3.5 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{event.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(event.startDate).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })} at{' '}
                          {new Date(event.startDate).toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit',
                            hour12: true 
                          })}
                        </p>
                      </div>
                      <ThemeBadge 
                        variant={event.status === 'PUBLISHED' ? 'success' : 'warning'} 
                        size="sm"
                      >
                        {event.status}
                      </ThemeBadge>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </ThemeCard>
      </div>
    </div>
  )
}

// Quick Action Card Component with theme colors
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
  const getBgClass = () => {
    switch(color) {
      case 'primary': return 'bg-theme-primary/10 group-hover:bg-theme-primary'
      case 'secondary': return 'bg-theme-secondary/10 group-hover:bg-theme-secondary'
      case 'accent': return 'bg-theme-accent/10 group-hover:bg-theme-accent'
      default: return 'bg-theme-primary/10 group-hover:bg-theme-primary'
    }
  }

  const getTextClass = () => {
    switch(color) {
      case 'primary': return 'text-theme-primary group-hover:text-white'
      case 'secondary': return 'text-theme-secondary group-hover:text-white'
      case 'accent': return 'text-theme-accent group-hover:text-white'
      default: return 'text-theme-primary group-hover:text-white'
    }
  }

  const getBorderClass = () => {
    switch(color) {
      case 'primary': return 'hover:border-theme-primary/30'
      case 'secondary': return 'hover:border-theme-secondary/30'
      case 'accent': return 'hover:border-theme-accent/30'
      default: return 'hover:border-theme-primary/30'
    }
  }

  const getTitleHoverClass = () => {
    switch(color) {
      case 'primary': return 'group-hover:text-theme-primary'
      case 'secondary': return 'group-hover:text-theme-secondary'
      case 'accent': return 'group-hover:text-theme-accent'
      default: return 'group-hover:text-theme-primary'
    }
  }

  return (
    <Link
      href={href}
      className={`group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all ${getBorderClass()}`}
    >
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors mb-3 ${getBgClass()}`}>
        <Icon className={`h-6 w-6 transition-colors ${getTextClass()}`} />
      </div>
      <h3 className={`font-semibold text-gray-900 transition-colors ${getTitleHoverClass()}`}>
        {title}
      </h3>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
    </Link>
  )
}