// app/portal/[orgSlug]/events/[eventId]/page.tsx
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Calendar, MapPin, Users, User, Building2, Info, Lock, Clock, Video, DollarSign, Ticket, ExternalLink, CalendarDays, MapPinned } from "lucide-react"
import { format } from "date-fns"
import Image from "next/image"
import { EventDetailsClient } from "./EventDetailsClient"

interface EventDetailsPageProps {
  params: Promise<{ orgSlug: string; eventId: string }>
}

export default async function EventDetailsPage({ params }: EventDetailsPageProps) {
  const session = await getServerSession(authOptions)
  const { orgSlug, eventId } = await params

  if (!session?.user?.id) {
    redirect(`/auth/login?callbackUrl=/portal/${orgSlug}/events/${eventId}`)
  }

  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
      organization: { slug: orgSlug },
      status: "ACTIVE",
    },
    include: {
      houseMemberships: {
        where: { status: "ACTIVE" },
        include: { house: true },
      },
    },
  })

  if (!membership) {
    redirect(`/organization/${orgSlug}`)
  }

  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      organization: { slug: orgSlug },
    },
    include: {
      house: true,
      creator: {
        select: {
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          rsvps: true,
        },
      },
      rsvps: {
        where: {
          membershipId: membership.id,
        },
        take: 1,
      },
    },
  })

  if (!event) {
    notFound()
  }

  const myRSVP = event.rsvps[0]

  const canAccess = event.houseId === null || membership.houseMemberships.some(hm => hm.houseId === event.houseId)
  
  if (!canAccess) {
    return (
      <div className="container max-w-4xl py-12">
        <Card className="text-center py-12">
          <CardContent>
            <Lock className="mx-auto h-12 w-12 text-muted-foreground" />
            <h1 className="mt-4 text-2xl font-bold">Access Denied</h1>
            <p className="mt-2 text-muted-foreground">
              This event is only available to members of {event.house?.name}.
              You are not a member of this house.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const eventData = {
    id: event.id,
    title: event.title,
    description: event.description,
    imageUrl: event.imageUrl,
    startDate: event.startDate,
    endDate: event.endDate,
    location: event.location,
    onlineUrl: event.onlineUrl,
    type: event.type,
    isFree: event.isFree,
    price: event.price,
    currency: event.currency,
    capacity: event.capacity,
    memberOnly: event.memberOnly,
    house: event.house ? {
      id: event.house.id,
      name: event.house.name,
      slug: event.house.slug,
    } : null,
    creator: event.creator,
    rsvpCount: event._count.rsvps,
    myRSVP: myRSVP ? {
      id: myRSVP.id,
      status: myRSVP.status,
      guestsCount: myRSVP.guestsCount,
      notes: myRSVP.notes,
    } : null,
  }

  const getEventTypeLabel = () => {
    switch (event.type) {
      case "IN_PERSON":
        return "In Person"
      case "ONLINE":
        return "Online"
      case "HYBRID":
        return "Hybrid"
      default:
        return "In Person"
    }
  }

  const getEventTypeIcon = () => {
    switch (event.type) {
      case "IN_PERSON":
        return <MapPin className="h-4 w-4" />
      case "ONLINE":
        return <Video className="h-4 w-4" />
      case "HYBRID":
        return <Video className="h-4 w-4" />
      default:
        return <MapPin className="h-4 w-4" />
    }
  }

  const formatAttendeePercentage = () => {
    if (!event.capacity) return null
    const percentage = (event._count.rsvps / event.capacity) * 100
    return Math.min(percentage, 100)
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      {/* Row 1: 3 columns - Image | Event Info | RSVP */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Left: Event Image */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            {event.imageUrl ? (
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-muted shadow-lg">
                <Image
                  src={event.imageUrl}
                  alt={event.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  priority
                />
              </div>
            ) : (
              <div className="w-full aspect-[4/3] rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-lg">
                <CalendarDays className="h-16 w-16 text-primary/40" />
              </div>
            )}
            
            {/* House Badge */}
            {event.house && (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>{event.house.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Center: Event Details */}
        <div className="lg:col-span-1 space-y-5">
          <div>
            <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1 inline-flex items-center gap-1">
              {getEventTypeIcon()}
              {getEventTypeLabel()}
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
          </div>

          {/* Date & Time */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50">
            <Calendar className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Date & Time</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(event.startDate), "EEEE, MMMM d, yyyy")}
              </p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(event.startDate), "h:mm a")} - 
                {format(new Date(event.endDate), "h:mm a")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                <Clock className="inline h-3 w-3 mr-1" />
                Timezone: {event.timezone || "UTC"}
              </p>
            </div>
          </div>

          {/* VENUE / LOCATION - Prominent Display */}
          {event.location && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MapPinned className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Venue</p>
                <p className="text-base text-muted-foreground mt-1">{event.location}</p>
                {event.type === "IN_PERSON" && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Physical event - Please arrive on time
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Online URL - Only for Online/Hybrid events */}
          {event.onlineUrl && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
              <Video className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Online Access</p>
                <a 
                  href={event.onlineUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-1"
                >
                  Join Online Event
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}

          {/* Organizer */}
          {event.creator && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50">
              <User className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Organizer</p>
                <p className="text-sm text-muted-foreground">{event.creator.name || "Organizer"}</p>
                <p className="text-xs text-muted-foreground">{event.creator.email}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right: RSVP Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <EventDetailsClient
              event={eventData}
              membershipId={membership.id}
              orgSlug={orgSlug}
            />
          </div>
        </div>
      </div>

      {/* Row 2: Description - Full width */}
      {event.description && (
        <div className="mb-8">
          <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/10">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Info className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-3">About This Event</h2>
                <div className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {event.description}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Row 3: 3 columns - Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t">
        {/* Ticket Information Card */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              Ticket Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Price</span>
              <span className="font-semibold text-lg">
                {event.isFree ? "Free" : `${event.currency} ${event.price}`}
              </span>
            </div>
            {event.capacity && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Capacity</span>
                  <span className="font-semibold">{event.capacity} people</span>
                </div>
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Available Spots</span>
                    <span>{event.capacity - event._count.rsvps} left</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${formatAttendeePercentage()}%` }}
                    />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Attendees Card */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Attendees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{event._count.rsvps}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {event._count.rsvps === 1 ? "person attending" : "people attending"}
            </p>
          </CardContent>
        </Card>

        {/* Additional Info Card */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Info className="h-4 w-4" />
              Additional Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Event Type</span>
              <Badge variant="outline" className="flex items-center gap-1">
                {getEventTypeIcon()}
                {getEventTypeLabel()}
              </Badge>
            </div>
            {event.location && (
              <div className="flex justify-between items-start gap-2">
                <span className="text-sm">Venue</span>
                <span className="text-sm text-right text-muted-foreground max-w-[60%]">{event.location}</span>
              </div>
            )}
            {event.memberOnly && (
              <div className="flex justify-between items-center">
                <span className="text-sm">Access</span>
                <Badge variant="secondary" className="gap-1">
                  <Lock className="h-3 w-3" />
                  Members Only
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}