// app/portal/[houseSlug]/events/[eventId]/page.tsx
import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  ArrowLeft,
  Ticket,
  Video,
  CheckCircle,
  Ban,
  Hourglass,
} from 'lucide-react'
import EventRsvpButton from '@/components/portal/EventRsvpButton'

interface EventDetailPageProps {
  params: {
    houseSlug: string
    eventId: string
  }
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { houseSlug, eventId } = await Promise.resolve(params)
  
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
      houseMemberships: {
        where: {
          status: 'ACTIVE',
          house: { slug: houseSlug }
        },
        include: { house: true }
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

  // Fetch event - no status filter so past events still show
  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      OR: [
        { houseId: targetHouse.id },
        { organizationId: targetHouse.organizationId, houseId: null }
      ]
    },
    include: {
      _count: { select: { rsvps: true } },
      rsvps: {
        where: memberAccess ? { houseMembershipId: memberAccess.id } : undefined,
        select: { id: true, status: true, guestsCount: true }
      },
      tickets: {
        where: { status: 'ACTIVE' },
        include: {
          _count: { select: { purchases: true } }
        }
      },
      creator: {
        select: { name: true, email: true }
      },
      house: {
        select: { name: true, slug: true }
      },
      organization: {
        select: { name: true, primaryColor: true }
      }
    }
  })

  if (!event) {
    notFound()
  }

  const primaryColor = event.organization?.primaryColor || '#8B5CF6'
  const userRsvp = event.rsvps[0]
  
  // Get event settings
  const settings = (event.settings as any) || {}
  const rsvpSettings = settings?.rsvp || {}
  const ticketSettings = settings?.tickets || {}
  
  // Proper event status checks
  const now = new Date()
  const eventStartDate = new Date(event.startDate)
  const eventEndDate = new Date(event.endDate)
  
  const isPast = eventEndDate < now
  const isOngoing = eventStartDate <= now && eventEndDate >= now
  const isUpcoming = eventStartDate > now
  
  // Check if RSVP is allowed (only for upcoming/ongoing PUBLISHED events)
  const isRsvpEnabled = rsvpSettings.enabled !== false
  const rsvpDeadlinePassed = rsvpSettings.deadline ? new Date(rsvpSettings.deadline) < now : false
  const canRsvp = event.status === 'PUBLISHED' && isRsvpEnabled && !isPast && !rsvpDeadlinePassed && (!event.memberOnly || !!memberAccess)
  
  // Get the primary status banner
  const getPrimaryStatus = () => {
    if (isPast) {
      return { icon: Clock, label: 'Past Event', color: 'bg-gray-100 text-gray-800' }
    }
    if (isOngoing) {
      return { icon: CheckCircle, label: 'Ongoing', color: 'bg-green-100 text-green-800' }
    }
    if (isUpcoming) {
      return { icon: Calendar, label: 'Upcoming', color: 'bg-blue-100 text-blue-800' }
    }
    return null
  }

  // Get RSVP availability status
  const getRsvpAvailability = () => {
    if (isPast) return null
    if (!isRsvpEnabled) return null
    if (event.status !== 'PUBLISHED') return null
    
    if (rsvpDeadlinePassed) {
      return { icon: Ban, label: 'RSVP Closed', color: 'bg-yellow-100 text-yellow-800' }
    }
    return { icon: CheckCircle, label: 'RSVP Open', color: 'bg-purple-100 text-purple-800' }
  }

  // User's RSVP status
  const getUserRsvpBadge = () => {
    if (!userRsvp) return null
    
    const statusConfig: Record<string, { icon: any; label: string; color: string }> = {
      CONFIRMED: { icon: CheckCircle, label: "You're Going", color: 'bg-green-100 text-green-800' },
      PENDING: { icon: Hourglass, label: 'Pending Approval', color: 'bg-yellow-100 text-yellow-800' },
      CANCELLED: { icon: Ban, label: 'Cancelled', color: 'bg-red-100 text-red-800' },
      ATTENDED: { icon: CheckCircle, label: 'Attended', color: 'bg-blue-100 text-blue-800' },
      NO_SHOW: { icon: Ban, label: 'No Show', color: 'bg-gray-100 text-gray-800' },
    }
    return statusConfig[userRsvp.status] || null
  }

  const primaryStatus = getPrimaryStatus()
  const rsvpAvailability = getRsvpAvailability()
  const userRsvpBadge = getUserRsvpBadge()
  
  const PrimaryIcon = primaryStatus?.icon || Calendar
  const RsvpIcon = rsvpAvailability?.icon || Ban
  const UserRsvpIcon = userRsvpBadge?.icon || CheckCircle

  // Format date range
  const formatDateRange = () => {
    const start = eventStartDate
    const end = eventEndDate
    const sameDay = start.toDateString() === end.toDateString()
    
    if (sameDay) {
      return `${start.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} • ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    }
    
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  }

  // Get RSVP status message for the button area
  const getRsvpStatusMessage = () => {
    if (event.status !== 'PUBLISHED') {
      return { icon: Ban, color: 'text-gray-600', bg: 'bg-gray-100', text: 'Not Available' }
    }
    if (isPast) {
      return { icon: Clock, color: 'text-gray-600', bg: 'bg-gray-100', text: 'Event Ended' }
    }
    if (!isRsvpEnabled) {
      return { icon: Ban, color: 'text-gray-600', bg: 'bg-gray-100', text: 'RSVP Not Available' }
    }
    if (rsvpDeadlinePassed) {
      return { icon: Ban, color: 'text-yellow-600', bg: 'bg-yellow-50', text: 'RSVP Closed' }
    }
    if (userRsvp) {
      if (userRsvp.status === 'CONFIRMED') {
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', text: "You're Going!" }
      }
      if (userRsvp.status === 'PENDING') {
        return { icon: Hourglass, color: 'text-yellow-600', bg: 'bg-yellow-50', text: 'Awaiting Approval' }
      }
      if (userRsvp.status === 'CANCELLED') {
        return { icon: Ban, color: 'text-red-600', bg: 'bg-red-50', text: 'Cancelled' }
      }
    }
    return { icon: CheckCircle, color: 'text-purple-600', bg: 'bg-purple-50', text: 'RSVP Now' }
  }

  const rsvpStatus = getRsvpStatusMessage()
  const StatusIcon = rsvpStatus.icon

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 py-6">
      {/* Back Button */}
      <Link
        href={`/portal/${houseSlug}/events`}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Events
      </Link>

      {/* Event Header */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Event Image */}
        {event.imageUrl ? (
          <img src={event.imageUrl} alt={event.title} className="w-full h-48 object-cover" />
        ) : (
          <div 
            className="w-full h-48 bg-gradient-to-br flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)` }}
          >
            <Calendar className="h-16 w-16 text-white opacity-50" />
          </div>
        )}

        <div className="p-6">
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
            
            {/* Event Status (DRAFT/PUBLISHED/CANCELLED) */}
            {event.status !== 'PUBLISHED' && (
              <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                {event.status}
              </span>
            )}
            
            {/* Primary Status (Upcoming/Ongoing/Past) */}
            {primaryStatus && (
              <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${primaryStatus.color}`}>
                <PrimaryIcon className="h-3 w-3" />
                {primaryStatus.label}
              </span>
            )}
            
            {/* RSVP Status - only show for PUBLISHED upcoming/ongoing */}
            {event.status === 'PUBLISHED' && !isPast && rsvpAvailability && (
              <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${rsvpAvailability.color}`}>
                <RsvpIcon className="h-3 w-3" />
                {rsvpAvailability.label}
              </span>
            )}
            
            {/* User RSVP Status */}
            {userRsvpBadge && (
              <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${userRsvpBadge.color}`}>
                <UserRsvpIcon className="h-3 w-3" />
                {userRsvpBadge.label}
              </span>
            )}
            
            {/* Member Only */}
            {event.memberOnly && (
              <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
                Members Only
              </span>
            )}
          </div>

          {/* Title and Description */}
          <h1 className="text-2xl font-bold text-gray-900 mb-3">{event.title}</h1>
          {event.description && <p className="text-gray-600 mb-5">{event.description}</p>}

          {/* Event Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {/* Date & Time */}
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700">Date & Time</p>
                <p className="text-sm text-gray-600">{formatDateRange()}</p>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700">Location</p>
                <p className="text-sm text-gray-600">{event.location || 'TBD'}</p>
                {event.onlineUrl && event.onlineUrl !== 'null' && event.onlineUrl !== '' && (
                  <a href={event.onlineUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-purple-600 hover:underline">
                    Join Link
                  </a>
                )}
              </div>
            </div>

            {/* Attendees */}
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700">Attendees</p>
                <p className="text-sm text-gray-600">
                  {event._count.rsvps} {event.capacity ? `/ ${event.capacity}` : ''} attending
                </p>
              </div>
            </div>

            {/* Time Zone */}
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700">Time Zone</p>
                <p className="text-sm text-gray-600">{event.timezone}</p>
              </div>
            </div>
          </div>

          {/* RSVP Settings Info */}
          {event.status === 'PUBLISHED' && isRsvpEnabled && !isPast && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              {rsvpSettings.maxGuestsPerRsvp > 0 && (
                <span>Max {rsvpSettings.maxGuestsPerRsvp} guest{rsvpSettings.maxGuestsPerRsvp !== 1 ? 's' : ''} per RSVP. </span>
              )}
              {rsvpSettings.deadline && !rsvpDeadlinePassed && (
                <span>RSVP by {new Date(rsvpSettings.deadline).toLocaleDateString()}. </span>
              )}
              {rsvpSettings.requireApproval && <span>RSVPs require approval.</span>}
            </div>
          )}
        </div>
      </div>

      {/* RSVP Button Section - Only show for PUBLISHED events that can accept RSVP */}
      {event.status === 'PUBLISHED' && (
        <div className="flex justify-center">
          {canRsvp ? (
            <EventRsvpButton 
              eventId={event.id}
              houseSlug={houseSlug}
              initialStatus={userRsvp?.status}
              guestsCount={userRsvp?.guestsCount || 0}
              capacity={event.capacity}
              currentAttendees={event._count.rsvps}
              memberAccessId={memberAccess?.id}
              startDate={event.startDate}
              maxGuests={rsvpSettings.maxGuestsPerRsvp || 1}
              requireApproval={rsvpSettings.requireApproval || false}
            />
          ) : (
            <div className={`px-6 py-3 rounded-lg ${rsvpStatus.bg} border`}>
              <div className="flex items-center gap-2">
                <StatusIcon className={`h-5 w-5 ${rsvpStatus.color}`} />
                <span className={`font-medium ${rsvpStatus.color}`}>{rsvpStatus.text}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tickets Section */}
      {ticketSettings.allowPurchases !== false && event.tickets.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tickets</h2>
          <div className="space-y-3">
            {event.tickets.map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{ticket.name}</p>
                  <p className="text-sm text-gray-500">
                    {ticket.price === 0 ? 'Free' : `${ticket.currency} ${ticket.price}`}
                  </p>
                  {ticketSettings.maxPerPurchase > 0 && (
                    <p className="text-xs text-gray-400">
                      Max {ticketSettings.maxPerPurchase} per person
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    {ticket.soldQuantity} / {ticket.totalQuantity} sold
                  </p>
                  {event.status === 'PUBLISHED' && !isPast && (
                    <Link
                      href={`/portal/${houseSlug}/tickets/${ticket.id}/purchase`}
                      className="inline-block mt-2 px-4 py-1.5 text-sm font-medium text-white rounded-lg"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Purchase
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}