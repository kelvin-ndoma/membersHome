// app/portal/[houseSlug]/dashboard/page.tsx
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import {
  Calendar,
  Ticket,
  Users,
  MessageSquare,
  ArrowRight,
  MapPin,
  Bell,
  UserCircle,
} from 'lucide-react'

interface PortalDashboardPageProps {
  params: {
    houseSlug: string
  }
}

export default async function PortalDashboardPage({ params }: PortalDashboardPageProps) {
  const { houseSlug } = await Promise.resolve(params)
  
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  // Find the house through user's memberships
  const userMemberships = await prisma.membership.findMany({
  where: {
    userId: session.user.id,
    status: 'ACTIVE'
  },
  include: {
    organization: {
      select: { id: true, name: true, slug: true, primaryColor: true }
    },
    houseMemberships: {
      where: {
        status: 'ACTIVE',
        house: { slug: houseSlug }
      },
      include: { 
        house: {
          include: { 
            organization: { select: { name: true, primaryColor: true } },
            memberPortal: true
          }
        },
        membership: {  // ← ADD THIS
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    }
  }
})

  let targetHouse = null
  let targetOrg = null
  let memberAccess = null

  for (const membership of userMemberships) {
    const hm = membership.houseMemberships[0]
    if (hm) {
      targetHouse = hm.house
      targetOrg = membership.organization
      memberAccess = hm
      break
    }
  }

  if (!targetHouse) {
    redirect('/portal/my-houses')
  }

  const primaryColor = targetOrg?.primaryColor || '#8B5CF6'

  const [upcomingEvents, recentAnnouncements, memberCount] = await Promise.all([
    prisma.event.findMany({
      where: {
        OR: [
          { houseId: targetHouse.id },
          { organizationId: targetHouse.organizationId, houseId: null }
        ],
        status: 'PUBLISHED',
        startDate: { gte: new Date() }
      },
      orderBy: { startDate: 'asc' },
      take: 3,
      include: {
        _count: { select: { rsvps: true } },
        rsvps: {
          where: { houseMembershipId: memberAccess?.id }
        }
      }
    }),
    prisma.communication.findMany({
      where: {
        OR: [
          { houseId: targetHouse.id },
          { organizationId: targetHouse.organizationId, houseId: null }
        ],
        status: 'SENT',
        type: 'ANNOUNCEMENT'
      },
      orderBy: { sentAt: 'desc' },
      take: 3
    }),
    prisma.houseMembership.count({
      where: { houseId: targetHouse.id, status: 'ACTIVE' }
    })
  ])

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div 
        className="rounded-2xl p-8 text-white"
        style={{ background: `linear-gradient(to right, ${primaryColor}, ${primaryColor}dd)` }}
      >
        <h1 className="text-3xl font-bold mb-2">
          Welcome back{memberAccess?.membership?.user?.name ? `, ${memberAccess.membership.user.name}` : ''}!
        </h1>
        <p className="opacity-90">
          {targetHouse.name} • {targetOrg?.name}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{upcomingEvents.length}</p>
          <p className="text-sm text-gray-500">Upcoming Events</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{memberCount}</p>
          <p className="text-sm text-gray-500">Total Members</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <Ticket className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">0</p>
          <p className="text-sm text-gray-500">My Tickets</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Upcoming Events</h2>
              <p className="text-sm text-gray-500">Events you might be interested in</p>
            </div>
            <Link
              href={`/portal/${houseSlug}/events`}
              className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          <div className="divide-y divide-gray-100">
            {upcomingEvents.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No upcoming events</p>
              </div>
            ) : (
              upcomingEvents.map((event) => {
                const hasRsvpd = event.rsvps.length > 0
                
                return (
                  <Link
                    key={event.id}
                    href={`/portal/${houseSlug}/events/${event.id}`}
                    className="block px-5 py-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{event.title}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(event.startDate).toLocaleDateString()}
                          </span>
                          {event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {event.location}
                            </span>
                          )}
                        </div>
                      </div>
                      {hasRsvpd && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          RSVP'd
                        </span>
                      )}
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>

        {/* Announcements */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-purple-600" />
              <h2 className="font-semibold text-gray-900">Announcements</h2>
            </div>
          </div>
          
          <div className="divide-y divide-gray-100">
            {recentAnnouncements.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No announcements yet</p>
              </div>
            ) : (
              recentAnnouncements.map((announcement) => (
                <div key={announcement.id} className="px-5 py-4">
                  <h3 className="font-medium text-gray-900 mb-1">{announcement.subject}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">{announcement.body}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(announcement.sentAt || announcement.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          href={`/portal/${houseSlug}/events`}
          className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-purple-300 transition group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Browse Events</p>
              <p className="text-xs text-gray-500">View and RSVP</p>
            </div>
          </div>
        </Link>
        
        <Link
          href={`/portal/${houseSlug}/directory`}
          className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-blue-300 transition group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Member Directory</p>
              <p className="text-xs text-gray-500">Connect with members</p>
            </div>
          </div>
        </Link>
        
        <Link
          href={`/portal/${houseSlug}/messages`}
          className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-green-300 transition group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Messages</p>
              <p className="text-xs text-gray-500">Chat with members</p>
            </div>
          </div>
        </Link>
        
        <Link
          href={`/portal/${houseSlug}/profile`}
          className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-orange-300 transition group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
              <UserCircle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">My Profile</p>
              <p className="text-xs text-gray-500">Update your info</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}