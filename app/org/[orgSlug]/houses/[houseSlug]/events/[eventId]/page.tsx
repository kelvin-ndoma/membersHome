// app/org/[orgSlug]/houses/[houseSlug]/events/[eventId]/page.tsx
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { 
  Calendar, 
  MapPin, 
  Users, 
  Ticket,
  Clock,
  Globe,
  DollarSign,
  CheckCircle,
  Settings2,
  Ban,
} from 'lucide-react'
import EventActions from '@/components/events/EventActions'

interface EventDetailPageProps {
  params: {
    orgSlug: string
    houseSlug: string
    eventId: string
  }
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const event = await prisma.event.findFirst({
    where: {
      id: params.eventId,
      OR: [
        { house: { slug: params.houseSlug, organization: { slug: params.orgSlug } } },
        { organization: { slug: params.orgSlug }, houseId: null }
      ]
    },
    include: {
      house: {
        select: {
          id: true,
          name: true,
          slug: true,
        }
      },
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
        }
      },
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      },
      _count: {
        select: {
          rsvps: true,
          tickets: true,
        }
      },
      rsvps: {
        include: {
          houseMembership: {
            include: {
              membership: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      image: true,
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      tickets: {
        include: {
          _count: {
            select: { purchases: true }
          }
        },
        orderBy: { price: 'asc' },
      }
    }
  })

  if (!event) {
    notFound()
  }

  const settings = (event.settings as any) || {}
  const rsvpSettings = settings.rsvp || {}
  const ticketSettings = settings.tickets || {}

  const totalAttendees = event.rsvps.filter(r => r.status === 'ATTENDED' || r.status === 'CONFIRMED').length
  const totalRevenue = event.tickets.reduce((sum, ticket) => {
    return sum + (ticket.price * ticket.soldQuantity)
  }, 0)
  const totalTicketsSold = event.tickets.reduce((sum, ticket) => sum + ticket.soldQuantity, 0)

  const statusColors = {
    DRAFT: 'bg-gray-100 text-gray-800',
    PUBLISHED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    COMPLETED: 'bg-blue-100 text-blue-800',
  }

  const rsvpStatusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    ATTENDED: 'bg-blue-100 text-blue-800',
    NO_SHOW: 'bg-gray-100 text-gray-800',
  }

  // Format date range
  const formatDateRange = () => {
    const start = event.startDate
    const end = event.endDate
    const sameDay = start.toDateString() === end.toDateString()
    
    if (sameDay) {
      return (
        <>
          {start.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          })}
          <br />
          <span className="text-sm text-gray-600">
            {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {' - '}
            {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </>
      )
    }
    
    return (
      <>
        {start.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        })}
        {' at '}
        {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        <br />
        <span className="text-sm text-gray-600">
          to {end.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          })}
          {' at '}
          {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <Link 
        href={`/org/${params.orgSlug}/houses/${params.houseSlug}/events`}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <Calendar className="h-4 w-4" />
        Back to Events
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {event.imageUrl ? (
          <img src={event.imageUrl} alt="" className="w-full h-64 object-cover" />
        ) : (
          <div className="w-full h-64 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Calendar className="h-16 w-16 text-white opacity-50" />
          </div>
        )}
        
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[event.status]}`}>
                  {event.status}
                </span>
                {event.memberOnly && (
                  <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                    Members Only
                  </span>
                )}
                {rsvpSettings.enabled && (
                  <span className="px-3 py-1 text-sm font-medium bg-purple-100 text-purple-800 rounded-full">
                    RSVP Open
                  </span>
                )}
              </div>
              
              <p className="text-gray-600 mb-6">{event.description || 'No description provided.'}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date & Time</p>
                    <p className="font-medium text-gray-900">
                      {formatDateRange()}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    {event.type === 'ONLINE' ? (
                      <Globe className="h-5 w-5 text-green-600" />
                    ) : (
                      <MapPin className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium text-gray-900">
                      {event.type === 'ONLINE' ? 'Online Event' : event.location || 'No location'}
                    </p>
                    {event.onlineUrl && (
                      <a 
                        href={event.onlineUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Join Meeting →
                      </a>
                    )}
                  </div>
                </div>

                {event.capacity && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Capacity</p>
                      <p className="font-medium text-gray-900">
                        {totalAttendees} / {event.capacity} attending
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Settings Summary */}
              {(rsvpSettings.enabled || ticketSettings.allowPurchases) && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-4 text-sm">
                  <Settings2 className="h-4 w-4 text-gray-400" />
                  {rsvpSettings.enabled && (
                    <span className="text-gray-600">
                      Max {rsvpSettings.maxGuestsPerRsvp || 1} guest{rsvpSettings.maxGuestsPerRsvp !== 1 ? 's' : ''} per RSVP
                      {rsvpSettings.deadline && (
                        <> • Deadline: {new Date(rsvpSettings.deadline).toLocaleDateString()}</>
                      )}
                    </span>
                  )}
                  {ticketSettings.allowPurchases && (
                    <span className="text-gray-600">
                      Max {ticketSettings.maxPerPurchase || 5} tickets per purchase
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <EventActions event={event} />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{event._count.rsvps}</p>
          <p className="text-sm text-gray-500">Total RSVPs</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalAttendees}</p>
          <p className="text-sm text-gray-500">Confirmed Attendees</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <Ticket className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalTicketsSold}</p>
          <p className="text-sm text-gray-500">Tickets Sold</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-orange-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {event.tickets[0]?.currency || 'USD'} {totalRevenue.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500">Total Revenue</p>
        </div>
      </div>

      {/* Tickets Section */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Tickets</h2>
            <p className="text-sm text-gray-500">Manage ticket types for this event</p>
          </div>
          <Link
            href={`/org/${params.orgSlug}/houses/${params.houseSlug}/tickets/create?eventId=${event.id}`}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
          >
            <Ticket className="h-4 w-4" />
            Add Ticket
          </Link>
        </div>
        
        <div className="divide-y divide-gray-100">
          {event.tickets.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <Ticket className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-3">No tickets created yet</p>
              <Link
                href={`/org/${params.orgSlug}/houses/${params.houseSlug}/tickets/create?eventId=${event.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
              >
                <Ticket className="h-4 w-4" />
                Create First Ticket
              </Link>
            </div>
          ) : (
            event.tickets.map((ticket) => {
              const soldPercentage = (ticket.soldQuantity / ticket.totalQuantity) * 100
              
              return (
                <Link
                  key={ticket.id}
                  href={`/org/${params.orgSlug}/houses/${params.houseSlug}/tickets/${ticket.id}`}
                  className="block px-5 py-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-gray-900">{ticket.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          ticket.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {ticket.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-600">
                          {ticket.price === 0 ? 'Free' : `${ticket.currency} ${ticket.price}`}
                        </span>
                        <span className="text-gray-600">
                          {ticket.soldQuantity} / {ticket.totalQuantity} sold
                        </span>
                        <span className="text-gray-600">
                          {ticket._count.purchases} purchases
                        </span>
                      </div>
                    </div>
                    <div className="w-32">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            ticket.soldQuantity >= ticket.totalQuantity ? 'bg-red-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(soldPercentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </div>

      {/* RSVPs Section */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Recent RSVPs</h2>
            <p className="text-sm text-gray-500">Latest attendee responses</p>
          </div>
          <Link
            href={`/org/${params.orgSlug}/houses/${params.houseSlug}/events/${event.id}/rsvps`}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            View all →
          </Link>
        </div>
        
        <div className="divide-y divide-gray-100">
          {event.rsvps.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No RSVPs yet</p>
            </div>
          ) : (
            event.rsvps.map((rsvp) => (
              <div key={rsvp.id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    {rsvp.houseMembership.membership.user.image ? (
                      <img 
                        src={rsvp.houseMembership.membership.user.image} 
                        alt="" 
                        className="w-10 h-10 rounded-full" 
                      />
                    ) : (
                      <span className="text-gray-600 font-medium">
                        {rsvp.houseMembership.membership.user.name?.[0] || 
                         rsvp.houseMembership.membership.user.email[0]}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {rsvp.houseMembership.membership.user.name || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {rsvp.houseMembership.membership.user.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${rsvpStatusColors[rsvp.status]}`}>
                    {rsvp.status}
                  </span>
                  {rsvp.guestsCount > 0 && (
                    <span className="text-xs text-gray-500">
                      +{rsvp.guestsCount} guest{rsvp.guestsCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}