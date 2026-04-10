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
} from 'lucide-react'

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
    { name: 'Total Members', value: house._count.members, icon: Users, color: 'blue' },
    { name: 'Events', value: house._count.events, icon: Calendar, color: 'green' },
    { name: 'Tickets Sold', value: house._count.tickets, icon: Ticket, color: 'purple' },
    { name: 'Engagement', value: '78%', icon: TrendingUp, color: 'orange' },
  ]

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{house.name} Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          {house.organization.name} • {house.description || 'No description'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mt-4">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-1">{stat.name}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href={`/org/${params.orgSlug}/houses/${params.houseSlug}/members`}
          className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition group"
        >
          <Users className="h-8 w-8 text-blue-600 mb-3" />
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">Manage Members</h3>
          <p className="text-sm text-gray-500 mt-1">View and manage house members</p>
        </Link>
        
        <Link
          href={`/org/${params.orgSlug}/houses/${params.houseSlug}/events/create`}
          className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition group"
        >
          <Calendar className="h-8 w-8 text-green-600 mb-3" />
          <h3 className="font-semibold text-gray-900 group-hover:text-green-600">Create Event</h3>
          <p className="text-sm text-gray-500 mt-1">Schedule a new event</p>
        </Link>
        
        <Link
          href={`/org/${params.orgSlug}/houses/${params.houseSlug}/tickets/create`}
          className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition group"
        >
          <Ticket className="h-8 w-8 text-purple-600 mb-3" />
          <h3 className="font-semibold text-gray-900 group-hover:text-purple-600">Create Ticket</h3>
          <p className="text-sm text-gray-500 mt-1">Set up ticket types for events</p>
        </Link>
      </div>

      {/* Recent Members & Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Members */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Members</h2>
            <Link
              href={`/org/${params.orgSlug}/houses/${params.houseSlug}/members`}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {house.members.length === 0 ? (
              <p className="px-6 py-8 text-center text-gray-500">No members yet</p>
            ) : (
              house.members.map((member) => (
                <div key={member.id} className="px-6 py-3 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    {member.membership.user.image ? (
                      <img src={member.membership.user.image} alt="" className="w-10 h-10 rounded-full" />
                    ) : (
                      <span className="text-gray-600 font-medium">
                        {member.membership.user.name?.[0] || member.membership.user.email[0]}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {member.membership.user.name || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-500">{member.membership.user.email}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    member.role === 'HOUSE_MANAGER' ? 'bg-blue-100 text-blue-800' :
                    member.role === 'HOUSE_ADMIN' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {member.role}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
            <Link
              href={`/org/${params.orgSlug}/houses/${params.houseSlug}/events/create`}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Create
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {house.events.length === 0 ? (
              <p className="px-6 py-8 text-center text-gray-500">No upcoming events</p>
            ) : (
              house.events.map((event) => (
                <Link
                  key={event.id}
                  href={`/org/${params.orgSlug}/houses/${params.houseSlug}/events/${event.id}`}
                  className="block px-6 py-3 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{event.title}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(event.startDate).toLocaleDateString()} at {' '}
                        {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      event.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {event.status}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}