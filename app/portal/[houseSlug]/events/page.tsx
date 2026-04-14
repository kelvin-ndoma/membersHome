// app/portal/[houseSlug]/events/page.tsx
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import {
  Calendar,
  MapPin,
  Users,
  Search,
  ChevronRight,
  Ticket,
  Video,
  Clock,
  CheckCircle,
} from 'lucide-react'

interface EventsPageProps {
  params: {
    houseSlug: string
  }
  searchParams: {
    page?: string
    search?: string
    type?: string
    upcoming?: string
  }
}

export default async function PortalEventsPage({ params, searchParams }: EventsPageProps) {
  const { houseSlug } = await Promise.resolve(params)
  const page = parseInt(searchParams.page || '1')
  const limit = 12
  const search = searchParams.search || ''
  const type = searchParams.type
  const upcoming = searchParams.upcoming !== 'false' // Default to true (show upcoming/ongoing)

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
              organization: { select: { name: true, primaryColor: true } }
            }
          }
        }
      }
    }
  })

  let targetHouse = null
  let memberAccess = null

  for (const membership of userMemberships) {
    const hm = membership.houseMemberships[0]
    if (hm) {
      targetHouse = hm.house
      memberAccess = hm
      break
    }
  }

  if (!targetHouse) {
    redirect('/portal/my-houses')
  }

  const primaryColor = targetHouse.organization?.primaryColor || '#8B5CF6'

  // Build where clause for events
  const where: any = {
    OR: [
      { houseId: targetHouse.id },
      { organizationId: targetHouse.organizationId, houseId: null }
    ],
    status: 'PUBLISHED'
  }

  // Handle upcoming/past filter
  if (upcoming) {
    // Show events that haven't ended yet (upcoming + ongoing)
    where.endDate = { gte: new Date() }
  } else {
    // Show only past events (already ended)
    where.endDate = { lt: new Date() }
  }

  if (type) {
    where.type = type
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { location: { contains: search, mode: 'insensitive' } },
    ]
  }

  // Get events
  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { startDate: upcoming ? 'asc' : 'desc' },
      include: {
        _count: { select: { rsvps: true } },
        rsvps: {
          where: memberAccess ? { houseMembershipId: memberAccess.id } : undefined,
          select: { id: true, status: true, guestsCount: true }
        },
        tickets: {
          where: { status: 'ACTIVE' },
          select: { id: true, name: true, price: true, currency: true }
        },
        creator: {
          select: { name: true }
        }
      }
    }),
    prisma.event.count({ where })
  ])

  // Get user's RSVPs separately
  const userRsvps = memberAccess 
    ? await prisma.rSVP.findMany({
        where: { houseMembershipId: memberAccess.id },
        select: { eventId: true, status: true }
      })
    : []

  const totalPages = Math.ceil(total / limit)
  const rsvpMap = new Map(userRsvps.map(r => [r.eventId, r.status]))

  // Get event types for filter
  const eventTypes = await prisma.event.groupBy({
    by: ['type'],
    where: {
      OR: [
        { houseId: targetHouse.id },
        { organizationId: targetHouse.organizationId, houseId: null }
      ],
      status: 'PUBLISHED'
    },
    _count: true
  })

  // Helper to format date range
  const formatDateRange = (start: Date, end: Date) => {
    const sameDay = start.toDateString() === end.toDateString()
    
    if (sameDay) {
      return (
        <>
          {start.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}
          {' • '}
          {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {' - '}
          {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </>
      )
    }
    
    return (
      <>
        {start.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })}
        {' - '}
        {end.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
      </>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Events</h1>
        <p className="text-sm text-gray-500 mt-1">
          Discover and join events at {targetHouse.name}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <form className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="Search events..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </form>

          {/* Type Filter */}
          <div className="flex gap-2">
            <Link
              href={`/portal/${houseSlug}/events?upcoming=${upcoming}${search ? `&search=${search}` : ''}`}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                !type ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Types
            </Link>
            {eventTypes.map((t) => (
              <Link
                key={t.type}
                href={`/portal/${houseSlug}/events?type=${t.type}&upcoming=${upcoming}${search ? `&search=${search}` : ''}`}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                  type === t.type ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t.type.replace('_', ' ')} ({t._count})
              </Link>
            ))}
          </div>

          {/* Upcoming/Ongoing / Past Toggle */}
          <div className="flex gap-2">
            <Link
              href={`/portal/${houseSlug}/events?upcoming=true${type ? `&type=${type}` : ''}${search ? `&search=${search}` : ''}`}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                upcoming ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Upcoming & Ongoing
            </Link>
            <Link
              href={`/portal/${houseSlug}/events?upcoming=false${type ? `&type=${type}` : ''}${search ? `&search=${search}` : ''}`}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                !upcoming ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Past Events
            </Link>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Found <span className="font-medium text-gray-900">{total}</span> event{total !== 1 ? 's' : ''}
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {events.map((event) => {
          const userRsvpStatus = rsvpMap.get(event.id)
          const hasTickets = event.tickets.length > 0
          const lowestPrice = hasTickets ? Math.min(...event.tickets.map(t => t.price)) : null
          const settings = (event.settings as any) || {}
          const rsvpSettings = settings.rsvp || {}
          const isRsvpEnabled = rsvpSettings.enabled !== false
          
          // Proper event status checks
          const now = new Date()
          const isPast = new Date(event.endDate) < now
          const isOngoing = new Date(event.startDate) <= now && new Date(event.endDate) >= now
          const isUpcoming = new Date(event.startDate) > now
          
          // Check if RSVP is still open
          const rsvpOpen = isRsvpEnabled && !isPast && (
            !rsvpSettings.deadline || new Date(rsvpSettings.deadline) > now
          )
          
          return (
            <Link
              key={event.id}
              href={`/portal/${houseSlug}/events/${event.id}`}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition group"
            >
              {/* Event Image */}
              {event.imageUrl ? (
                <img src={event.imageUrl} alt="" className="w-full h-40 object-cover" />
              ) : (
                <div 
                  className="w-full h-40 bg-gradient-to-br flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)` }}
                >
                  <Calendar className="h-12 w-12 text-white opacity-50" />
                </div>
              )}

              <div className="p-5">
                {/* Status Badges */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {/* Event Type */}
                  {event.type === 'ONLINE' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      <Video className="h-3 w-3" />
                      Online
                    </span>
                  ) : event.type === 'HYBRID' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                      Hybrid
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      <MapPin className="h-3 w-3" />
                      In Person
                    </span>
                  )}
                  
                  {/* Event Status */}
                  {isUpcoming && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      <Calendar className="h-3 w-3" />
                      Upcoming
                    </span>
                  )}
                  
                  {isOngoing && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      <Clock className="h-3 w-3" />
                      Ongoing
                    </span>
                  )}
                  
                  {isPast && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                      <Clock className="h-3 w-3" />
                      Past
                    </span>
                  )}
                  
                  {/* RSVP Status */}
                  {isRsvpEnabled && rsvpOpen && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                      <CheckCircle className="h-3 w-3" />
                      RSVP Open
                    </span>
                  )}
                  
                  {isRsvpEnabled && !rsvpOpen && !isPast && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                      <Clock className="h-3 w-3" />
                      RSVP Closed
                    </span>
                  )}
                  
                  {/* User's RSVP Status */}
                  {userRsvpStatus && (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      userRsvpStatus === 'CONFIRMED' || userRsvpStatus === 'ATTENDED'
                        ? 'bg-green-100 text-green-800'
                        : userRsvpStatus === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-800'
                        : userRsvpStatus === 'CANCELLED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {userRsvpStatus === 'CONFIRMED' ? '✓ Going' : 
                       userRsvpStatus === 'ATTENDED' ? '✓ Attended' : 
                       userRsvpStatus === 'PENDING' ? '⏳ Pending' :
                       userRsvpStatus === 'CANCELLED' ? '✗ Cancelled' :
                       userRsvpStatus}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition mb-2">
                  {event.title}
                </h3>
                
                {/* Description */}
                {event.description && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                    {event.description}
                  </p>
                )}

                {/* Details */}
                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span>{formatDateRange(event.startDate, event.endDate)}</span>
                  </div>
                  
                  {event.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 flex-shrink-0" />
                    <span>{event._count.rsvps} attending</span>
                  </div>

                  {hasTickets && lowestPrice !== null && (
                    <div className="flex items-center gap-2">
                      <Ticket className="h-4 w-4 flex-shrink-0" />
                      <span>
                        {lowestPrice === 0 ? 'Free' : `From ${event.tickets[0].currency} ${lowestPrice}`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {event.creator?.name ? `By ${event.creator.name}` : ''}
                  </span>
                  <span className="text-sm font-medium text-purple-600 group-hover:text-purple-700">
                    View Details
                    <ChevronRight className="inline h-4 w-4 ml-1" />
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Empty State */}
      {events.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
          <p className="text-gray-500">
            {search ? 'Try adjusting your search filters' : 
             upcoming ? 'No upcoming or ongoing events' : 
             'No past events to display'}
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/portal/${houseSlug}/events?page=${page - 1}${type ? `&type=${type}` : ''}${upcoming ? '&upcoming=true' : '&upcoming=false'}${search ? `&search=${search}` : ''}`}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Previous
            </Link>
          )}
          <span className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/portal/${houseSlug}/events?page=${page + 1}${type ? `&type=${type}` : ''}${upcoming ? '&upcoming=true' : '&upcoming=false'}${search ? `&search=${search}` : ''}`}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  )
}