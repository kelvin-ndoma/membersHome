import { notFound } from "next/navigation"
import Link from "next/link"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { 
  Calendar, MapPin, Users, Ticket, ArrowLeft, 
  Globe, Video, Lock, Clock, CheckCircle
} from "lucide-react"
import { format } from "date-fns"
import { PublicRSVPButton } from "@/components/events/PublicRSVPButton"

interface PublicEventPageProps {
  params: Promise<{ orgSlug: string; eventSlug: string }>
  searchParams: Promise<{ rsvp?: string }>
}

export default async function PublicEventPage({ params, searchParams }: PublicEventPageProps) {
  const session = await getServerSession(authOptions)
  const { orgSlug, eventSlug } = await params
  const { rsvp: rsvpSuccess } = await searchParams

  const organization = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: { id: true, name: true, logoUrl: true },
  })

  if (!organization) {
    notFound()
  }

  const event = await prisma.event.findFirst({
    where: {
      slug: eventSlug,
      organizationId: organization.id,
      status: "PUBLISHED",
    },
    include: {
      house: {
        select: { id: true, name: true },
      },
      tickets: {
        where: { status: "ACTIVE", isPublic: true },
      },
      _count: {
        select: { rsvps: true },
      },
    },
  })

  if (!event) {
    notFound()
  }

  const isFull = event.capacity && event._count.rsvps >= event.capacity
  const isUpcoming = new Date(event.startDate) > new Date()
  const isPast = new Date(event.endDate) < new Date()
  const isAvailable = event.status === "PUBLISHED" && isUpcoming && !isFull

  // Check if user is logged in and has membership
  let userMembership = null
  let hasRSVP = false
  let userRSVP = null

  if (session?.user?.id) {
    userMembership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organizationId: organization.id,
        status: "ACTIVE",
      },
    })

    if (userMembership) {
      userRSVP = await prisma.rSVP.findFirst({
        where: {
          eventId: event.id,
          membershipId: userMembership.id,
        },
      })
      hasRSVP = !!userRSVP
    }
  }

  const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-800",
    PUBLISHED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
    COMPLETED: "bg-blue-100 text-blue-800",
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto max-w-6xl px-4 py-4">
          <Link href="/" className="text-xl font-bold text-primary">
            {organization.name}
          </Link>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-8">
        {rsvpSuccess === "success" && (
          <div className="mb-6 rounded-lg bg-green-50 p-4 text-green-800">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">RSVP confirmed!</span>
            </div>
            <p className="text-sm mt-1">You have successfully RSVP'd to this event.</p>
          </div>
        )}

        {rsvpSuccess === "cancelled" && (
          <div className="mb-6 rounded-lg bg-yellow-50 p-4 text-yellow-800">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span className="font-medium">RSVP cancelled</span>
            </div>
            <p className="text-sm mt-1">Your RSVP has been cancelled.</p>
          </div>
        )}

        {/* Event Image */}
        {event.imageUrl && (
          <div className="mb-6 overflow-hidden rounded-lg border">
            <img 
              src={event.imageUrl} 
              alt={event.title}
              className="h-64 w-full object-cover"
            />
          </div>
        )}

        {/* Event Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{event.title}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge className={statusColors[event.status]}>{event.status}</Badge>
            {event.memberOnly && (
              <Badge variant="outline" className="gap-1">
                <Lock className="h-3 w-3" />
                Members Only
              </Badge>
            )}
            {event.isFree ? (
              <Badge variant="secondary">Free</Badge>
            ) : (
              <Badge variant="default">${event.price}</Badge>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Description */}
            {event.description && (
              <Card>
                <CardHeader>
                  <CardTitle>About this event</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-muted-foreground">
                    {event.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Event Details */}
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Date & Time</p>
                    <p className="text-muted-foreground">
                      {format(new Date(event.startDate), "EEEE, MMMM d, yyyy")}
                    </p>
                    <p className="text-muted-foreground">
                      {format(new Date(event.startDate), "h:mm a")} - {format(new Date(event.endDate), "h:mm a")}
                    </p>
                  </div>
                </div>

                {event.location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-muted-foreground">{event.location}</p>
                    </div>
                  </div>
                )}

                {event.onlineUrl && (
                  <div className="flex items-start gap-3">
                    <Video className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Online Event</p>
                      <a 
                        href={event.onlineUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline break-all"
                      >
                        {event.onlineUrl}
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* RSVP Card */}
            <Card>
              <CardHeader>
                <CardTitle>RSVP</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Attendees</span>
                  <span>{event._count.rsvps} {event.capacity ? `/ ${event.capacity}` : ""}</span>
                </div>
                {event.capacity && (
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${(event._count.rsvps / event.capacity) * 100}%` }}
                    />
                  </div>
                )}

                {hasRSVP ? (
                  <div className="space-y-3">
                    <div className="rounded-lg bg-green-50 p-3 text-center text-green-800">
                      <CheckCircle className="mx-auto h-5 w-5 mb-1" />
                      <p className="text-sm font-medium">You're attending!</p>
                      {userRSVP && userRSVP.guestsCount && userRSVP.guestsCount > 0 && (
                        <p className="text-xs mt-1">
                          +{userRSVP.guestsCount} guest{userRSVP.guestsCount !== 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                    <PublicRSVPButton
                      eventId={event.id}
                      orgSlug={orgSlug}
                      action="cancel"
                      isLoggedIn={!!session}
                      isMember={!!userMembership}
                    />
                  </div>
                ) : isAvailable ? (
                  event.memberOnly && !userMembership ? (
                    <div className="rounded-lg bg-yellow-50 p-3 text-center text-yellow-800">
                      <Lock className="mx-auto h-5 w-5 mb-1" />
                      <p className="text-sm font-medium">Members Only Event</p>
                      <p className="text-xs mt-1">
                        Please join the organization to RSVP.
                      </p>
                    </div>
                  ) : (
                    <PublicRSVPButton
                      eventId={event.id}
                      orgSlug={orgSlug}
                      action="rsvp"
                      isLoggedIn={!!session}
                      isMember={!!userMembership}
                    />
                  )
                ) : (
                  <div className="rounded-lg bg-muted p-3 text-center text-muted-foreground">
                    {isPast ? "This event has passed" : isFull ? "Event is full" : "Not available"}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tickets Card */}
            {event.tickets.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ticket className="h-5 w-5" />
                    Tickets
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {event.tickets.map((ticket) => (
                    <div key={ticket.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{ticket.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {ticket.currency} {ticket.price}
                        </p>
                      </div>
                      <Link href={`/tickets/${ticket.id}`}>
                        <Button size="sm">Buy</Button>
                      </Link>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Share Card */}
            <Card>
              <CardHeader>
                <CardTitle>Share</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Share this event with others:
                </p>
                <div className="mt-2 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href)
                      alert("Link copied to clipboard!")
                    }}
                  >
                    Copy Link
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}