// app/org/[orgSlug]/houses/[houseSlug]/events/page.tsx
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { 
  Calendar, 
  Plus, 
  MapPin, 
  Users,
  Ticket,
  MoreVertical,
  Edit,
  Copy,
  Eye,
  Clock,
} from 'lucide-react'

interface EventsPageProps {
  params: {
    orgSlug: string
    houseSlug: string
  }
  searchParams: {
    page?: string
    status?: string
    type?: string
    upcoming?: string
  }
}

export default async function EventsPage({ params, searchParams }: EventsPageProps) {
  const page = parseInt(searchParams.page || '1')
  const limit = 12
  const status = searchParams.status
  const type = searchParams.type
  const upcoming = searchParams.upcoming === 'true'

  const house = await prisma.house.findFirst({
    where: {
      slug: params.houseSlug,
      organization: { slug: params.orgSlug }
    },
    include: {
      organization: true,
    }
  })

  if (!house) {
    return <div>House not found</div>
  }

  const where: any = {
    OR: [
      { houseId: house.id },
      { organizationId: house.organizationId, houseId: null }
    ]
  }

  if (status) where.status = status
  if (type) where.type = type
  if (upcoming) {
    where.startDate = { gte: new Date() }
  }

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { startDate: upcoming ? 'asc' : 'desc' },
      include: {
        _count: {
          select: { 
            rsvps: true,
            tickets: true,
          }
        },
        tickets: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            price: true,
            currency: true,
            soldQuantity: true,
            totalQuantity: true,
          }
        },
        creator: {
          select: { name: true }
        }
      }
    }),
    prisma.event.count({ where })
  ])

  const totalPages = Math.ceil(total / limit)

  // Calculate ticket stats for each event
  const eventsWithStats = events.map(event => {
    const ticketStats = event.tickets.reduce((acc, ticket) => {
      acc.totalTickets += ticket.totalQuantity
      acc.soldTickets += ticket.soldQuantity
      acc.totalRevenue += ticket.price * ticket.soldQuantity
      acc.minPrice = Math.min(acc.minPrice, ticket.price)
      return acc
    }, {
      totalTickets: 0,
      soldTickets: 0,
      totalRevenue: 0,
      minPrice: Infinity,
    })

    return {
      ...event,
      ticketStats: {
        ...ticketStats,
        minPrice: ticketStats.minPrice === Infinity ? null : ticketStats.minPrice,
        currency: event.tickets[0]?.currency || 'USD',
      }
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-sm text-gray-500 mt-1">
            {house.name} • {total} total events
          </p>
        </div>
        <Link
          href={`/org/${params.orgSlug}/houses/${params.houseSlug}/events/create`}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Create Event
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-2">
            <Link
              href={`?upcoming=false`}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                !upcoming ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Events
            </Link>
            <Link
              href={`?upcoming=true`}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                upcoming ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Upcoming
            </Link>
          </div>

          <div className="flex gap-2">
            <Link
              href={`?${new URLSearchParams({ ...searchParams, status: '' })}`}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                !status ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Status
            </Link>
            <Link
              href={`?${new URLSearchParams({ ...searchParams, status: 'PUBLISHED' })}`}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                status === 'PUBLISHED' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Published
            </Link>
            <Link
              href={`?${new URLSearchParams({ ...searchParams, status: 'DRAFT' })}`}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                status === 'DRAFT' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Draft
            </Link>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {eventsWithStats.map((event) => (
          <div key={event.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition">
            {/* Event Image */}
            {event.imageUrl ? (
              <img src={event.imageUrl} alt="" className="w-full h-48 object-cover" />
            ) : (
              <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Calendar className="h-12 w-12 text-white opacity-50" />
              </div>
            )}

            <div className="p-5">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <Link
                    href={`/org/${params.orgSlug}/houses/${params.houseSlug}/events/${event.id}`}
                    className="group"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition">
                      {event.title}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      event.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                      event.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                      event.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {event.status}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      event.type === 'IN_PERSON' ? 'bg-blue-100 text-blue-800' :
                      event.type === 'ONLINE' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {event.type.replace('_', ' ')}
                    </span>
                    {/* RSVP Status Badge */}
                    {((event.settings as any)?.rsvp?.enabled) && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                        RSVP Open
                      </span>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Description */}
              {event.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {event.description}
                </p>
              )}

              {/* Event Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span>{formatDateRange(event.startDate, event.endDate)}</span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{event.location}</span>
                  </div>
                )}
              </div>

              {/* Stats Row */}
              <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span>{event._count.rsvps} attending</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Ticket className="h-4 w-4 text-gray-400" />
                  <span>{event._count.tickets} ticket types</span>
                </div>
              </div>

              {/* Tickets Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">Tickets</h4>
                  <Link
                    href={`/org/${params.orgSlug}/houses/${params.houseSlug}/tickets?eventId=${event.id}`}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    Manage Tickets →
                  </Link>
                </div>

                {event.tickets.length === 0 ? (
                  <Link
                    href={`/org/${params.orgSlug}/houses/${params.houseSlug}/tickets/create?eventId=${event.id}`}
                    className="block w-full px-4 py-2 text-center text-sm text-gray-600 bg-gray-50 border border-dashed border-gray-300 rounded-lg hover:border-blue-300 hover:text-blue-600 transition"
                  >
                    <Plus className="h-4 w-4 inline mr-1" />
                    Add Tickets
                  </Link>
                ) : (
                  <div className="space-y-2">
                    {event.tickets.slice(0, 2).map((ticket) => (
                      <Link
                        key={ticket.id}
                        href={`/org/${params.orgSlug}/houses/${params.houseSlug}/tickets/${ticket.id}`}
                        className="block p-3 bg-gray-50 rounded-lg hover:bg-purple-50 transition group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900 group-hover:text-purple-700">
                            {ticket.price === 0 ? 'Free' : `${ticket.currency} ${ticket.price}`}
                          </span>
                          <span className="text-xs text-gray-500">
                            {ticket.soldQuantity} / {ticket.totalQuantity} sold
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${(ticket.soldQuantity / ticket.totalQuantity) * 100}%` }}
                          />
                        </div>
                      </Link>
                    ))}
                    {event.tickets.length > 2 && (
                      <Link
                        href={`/org/${params.orgSlug}/houses/${params.houseSlug}/tickets?eventId=${event.id}`}
                        className="block text-center text-xs text-gray-500 hover:text-blue-600"
                      >
                        +{event.tickets.length - 2} more ticket types
                      </Link>
                    )}
                  </div>
                )}

                {/* Ticket Stats Summary */}
                {event.ticketStats.totalTickets > 0 && (
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
                    <span>
                      {event.ticketStats.soldTickets} of {event.ticketStats.totalTickets} tickets sold
                    </span>
                    {event.ticketStats.totalRevenue > 0 && (
                      <span className="font-medium text-gray-900">
                        {event.ticketStats.currency} {event.ticketStats.totalRevenue.toFixed(2)}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                <Link
                  href={`/org/${params.orgSlug}/houses/${params.houseSlug}/events/${event.id}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                >
                  <Eye className="h-4 w-4" />
                  View Details
                </Link>
                <Link
                  href={`/org/${params.orgSlug}/houses/${params.houseSlug}/events/${event.id}/edit`}
                  className="inline-flex items-center justify-center p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  <Edit className="h-4 w-4" />
                </Link>
                <button className="inline-flex items-center justify-center p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {events.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
          <p className="text-gray-500 mb-4">Create your first event to start selling tickets</p>
          <Link
            href={`/org/${params.orgSlug}/houses/${params.houseSlug}/events/create`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Create Event
          </Link>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && (
            <Link
              href={`?${new URLSearchParams({ ...searchParams, page: String(page - 1) })}`}
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
              href={`?${new URLSearchParams({ ...searchParams, page: String(page + 1) })}`}
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