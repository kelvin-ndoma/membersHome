// app/org/[orgSlug]/houses/[houseSlug]/tickets/page.tsx
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { 
  Ticket, 
  Plus, 
  Search,
  Calendar,
  Users,
  DollarSign,
  ChevronRight,
} from 'lucide-react'

interface TicketsPageProps {
  params: {
    orgSlug: string
    houseSlug: string
  }
  searchParams: {
    eventId?: string
    status?: string
  }
}

export default async function TicketsPage({ params, searchParams }: TicketsPageProps) {
  const eventId = searchParams.eventId
  const status = searchParams.status

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

  // Get all events for this house (for filter dropdown)
  const events = await prisma.event.findMany({
    where: {
      OR: [
        { houseId: house.id },
        { organizationId: house.organizationId, houseId: null }
      ]
    },
    orderBy: { startDate: 'desc' },
    include: {
      _count: {
        select: { tickets: true }
      }
    }
  })

  // If an event is selected, get its details
  const selectedEvent = eventId ? await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      tickets: {
        where: status ? { status: status as any } : {},
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { purchases: true }
          }
        }
      },
      _count: {
        select: { tickets: true }
      }
    }
  }) : null

  // Get all tickets if no event selected (grouped by event)
  const allTickets = !eventId ? await prisma.ticket.findMany({
    where: {
      OR: [
        { houseId: house.id },
        { organizationId: house.organizationId, houseId: null }
      ],
      ...(status ? { status: status as any } : {})
    },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { purchases: true }
      },
      event: {
        select: {
          id: true,
          title: true,
          startDate: true,
        }
      }
    }
  }) : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
          <p className="text-sm text-gray-500 mt-1">
            {house.name} • Manage event tickets
          </p>
        </div>
        <Link
          href={`/org/${params.orgSlug}/houses/${params.houseSlug}/events`}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Calendar className="h-4 w-4" />
          View Events
        </Link>
      </div>

      {/* Event Selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Select an Event to Manage Tickets
        </label>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/org/${params.orgSlug}/houses/${params.houseSlug}/tickets`}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              !eventId 
                ? 'bg-purple-100 text-purple-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Events ({events.reduce((sum, e) => sum + e._count.tickets, 0)})
          </Link>
          {events.map((event) => (
            <Link
              key={event.id}
              href={`?eventId=${event.id}`}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                eventId === event.id 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {event.title} ({event._count.tickets})
            </Link>
          ))}
        </div>
      </div>

      {/* Selected Event Tickets */}
      {selectedEvent ? (
        <div className="space-y-4">
          {/* Event Header */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{selectedEvent.title}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {new Date(selectedEvent.startDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </p>
                <p className="text-sm text-gray-500 mt-1">{selectedEvent.location || 'Online Event'}</p>
              </div>
              <Link
                href={`/org/${params.orgSlug}/houses/${params.houseSlug}/tickets/create?eventId=${selectedEvent.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
              >
                <Plus className="h-4 w-4" />
                Add Ticket
              </Link>
            </div>
          </div>

          {/* Tickets Grid */}
          {selectedEvent.tickets.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets for this event</h3>
              <p className="text-gray-500 mb-4">Create tickets for this event to start selling</p>
              <Link
                href={`/org/${params.orgSlug}/houses/${params.houseSlug}/tickets/create?eventId=${selectedEvent.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
              >
                <Plus className="h-4 w-4" />
                Create First Ticket
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {selectedEvent.tickets.map((ticket) => {
                const soldPercentage = (ticket.soldQuantity / ticket.totalQuantity) * 100
                const isSoldOut = ticket.soldQuantity >= ticket.totalQuantity
                
                return (
                  <Link
                    key={ticket.id}
                    href={`/org/${params.orgSlug}/houses/${params.houseSlug}/tickets/${ticket.id}`}
                    className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                          <Ticket className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition">
                            {ticket.name}
                          </h3>
                          <p className="text-sm text-gray-500">{ticket.type.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        ticket.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                        ticket.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                        ticket.status === 'SOLD_OUT' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span className="text-xl font-bold text-gray-900">
                        {ticket.currency} {ticket.price.toFixed(2)}
                      </span>
                      {ticket.memberOnly && (
                        <span className="ml-auto px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                          Members Only
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Sold</span>
                        <span className="font-medium text-gray-900">
                          {ticket.soldQuantity} / {ticket.totalQuantity}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            isSoldOut ? 'bg-red-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(soldPercentage, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Users className="h-4 w-4" />
                        <span>{ticket._count.purchases} purchases</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-purple-600 transition" />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        /* All Tickets grouped by event */
        <div className="space-y-6">
          {Object.entries(
            allTickets.reduce((acc, ticket) => {
              const eventKey = ticket.event?.id || 'no-event'
              if (!acc[eventKey]) acc[eventKey] = []
              acc[eventKey].push(ticket)
              return acc
            }, {} as Record<string, typeof allTickets>)
          ).map(([eventId, tickets]) => {
            const event = tickets[0]?.event
            return (
              <div key={eventId} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {event?.title || 'Standalone Tickets'}
                    </h3>
                    {event && (
                      <p className="text-sm text-gray-500">
                        {new Date(event.startDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`?eventId=${eventId}`}
                    className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
                  >
                    View all tickets
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tickets.slice(0, 3).map((ticket) => (
                      <Link
                        key={ticket.id}
                        href={`/org/${params.orgSlug}/houses/${params.houseSlug}/tickets/${ticket.id}`}
                        className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 hover:shadow-sm transition group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{ticket.name}</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {ticket.currency} {ticket.price}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">{ticket.soldQuantity} sold</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            ticket.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {ticket.status}
                          </span>
                        </div>
                      </Link>
                    ))}
                    {tickets.length > 3 && (
                      <Link
                        href={`?eventId=${eventId}`}
                        className="border border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center text-gray-500 hover:border-purple-300 hover:text-purple-600 transition"
                      >
                        +{tickets.length - 3} more tickets
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}