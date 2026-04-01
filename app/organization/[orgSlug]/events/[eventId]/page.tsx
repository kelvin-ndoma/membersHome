import { notFound } from "next/navigation"
import Link from "next/link"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar"
import { 
  Calendar, MapPin, Users, Ticket, Edit, 
  Video, Lock, Unlock, Clock, CheckCircle, 
  CalendarDays, Building2, Link2, Share2
} from "lucide-react"
import { format } from "date-fns"

interface EventPageProps {
  params: Promise<{ orgSlug: string; eventId: string }>
}

export default async function EventDetailPage({ params }: EventPageProps) {
  const session = await getServerSession(authOptions)
  const { orgSlug, eventId } = await params

  if (!session) {
    redirect("/auth/login")
  }

  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
      organization: { slug: orgSlug },
      status: "ACTIVE",
    },
  })

  if (!membership) {
    redirect("/organization")
  }

  const organization = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: { id: true, name: true, logoUrl: true, primaryColor: true },
  })

  if (!organization) {
    notFound()
  }

  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      organizationId: organization.id,
    },
    include: {
      house: {
        select: { id: true, name: true, slug: true },
      },
      creator: {
        select: { id: true, name: true, email: true, image: true },
      },
      tickets: {
        where: { status: "ACTIVE" },
      },
      rsvps: {
        take: 8,
        include: {
          membership: {
            include: {
              user: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
          },
        },
      },
      _count: {
        select: { rsvps: true, tickets: true },
      },
    },
  })

  if (!event) {
    notFound()
  }

  const userRSVP = await prisma.rSVP.findFirst({
    where: {
      eventId: event.id,
      membershipId: membership.id,
    },
  })

  const canManage = membership.organizationRole === "ORG_ADMIN" || 
                    membership.organizationRole === "ORG_OWNER" ||
                    event.createdBy === session.user.id

  const isFull = event.capacity && event._count.rsvps >= event.capacity
  const isUpcoming = new Date(event.startDate) > new Date()
  const isPast = new Date(event.endDate) < new Date()
  const canRSVP = event.status === "PUBLISHED" && isUpcoming && !isFull && (!event.memberOnly || (event.memberOnly && membership))
  const isMemberOnly = event.memberOnly

  const formatAttendeeName = (user: any) => {
    return user.name || user.email?.split("@")[0] || "Anonymous"
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const startDate = new Date(event.startDate)
  const endDate = new Date(event.endDate)

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      DRAFT: { label: "Draft", className: "bg-gray-100 text-gray-800" },
      PUBLISHED: { label: "Published", className: "bg-green-100 text-green-800" },
      CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-800" },
      COMPLETED: { label: "Completed", className: "bg-blue-100 text-blue-800" },
    }
    const { label, className } = config[status] || config.DRAFT
    return <Badge className={className}>{label}</Badge>
  }

  // Helper to safely get address string
  const getAddressString = (address: any): string | null => {
    if (!address) return null
    if (typeof address === "string") return address
    if (typeof address === "object") {
      const addr = address as any
      return [addr.street, addr.city, addr.state, addr.zip].filter(Boolean).join(", ")
    }
    return null
  }

  const addressString = getAddressString(event.address)

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <div className="relative">
        {event.imageUrl ? (
          <div className="relative h-[40vh] min-h-[300px] max-h-[500px] w-full overflow-hidden">
            <img 
              src={event.imageUrl} 
              alt={event.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          </div>
        ) : (
          <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/5" />
        )}
        
        <div className="container mx-auto px-4 md:px-6 -mt-16 relative z-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                {getStatusBadge(event.status)}
                {isMemberOnly && (
                  <Badge variant="outline" className="gap-1 bg-background/80 backdrop-blur-sm">
                    <Lock className="h-3 w-3" />
                    Members Only
                  </Badge>
                )}
                {event.house && (
                  <Link href={`/organization/${orgSlug}/houses/${event.house.slug}`}>
                    <Badge variant="secondary" className="gap-1 hover:bg-secondary/80">
                      <Building2 className="h-3 w-3" />
                      {event.house.name}
                    </Badge>
                  </Link>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
                {event.title}
              </h1>
              <div className="flex flex-wrap gap-6 mt-4 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  <span>
                    {format(startDate, "EEEE, MMMM d")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    {format(startDate, "h:mm a")} - {format(endDate, "h:mm a")}
                  </span>
                </div>
                {(event.location || event.onlineUrl) && (
                  <div className="flex items-center gap-2">
                    {event.type === "ONLINE" ? (
                      <Video className="h-4 w-4" />
                    ) : (
                      <MapPin className="h-4 w-4" />
                    )}
                    <span>
                      {event.location || (event.onlineUrl ? "Online Event" : "TBD")}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              {canManage && (
                <Link href={`/organization/${orgSlug}/events/${event.id}/manage`}>
                  <Button variant="outline" className="gap-2">
                    <Edit className="h-4 w-4" />
                    Manage
                  </Button>
                </Link>
              )}
              <Button variant="outline" size="icon">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            {event.description && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl">About This Event</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {event.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Location Details */}
            {(event.location || addressString || event.onlineUrl) && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl flex items-center gap-2">
                    {event.type === "ONLINE" ? <Video className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
                    {event.type === "ONLINE" ? "Online Event" : "Location"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {event.location && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">{event.location}</p>
                        {addressString && (
                          <p className="text-sm text-muted-foreground mt-1">{addressString}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {event.onlineUrl && (
                    <div className="flex items-start gap-3 mt-4">
                      <Link2 className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <a 
                          href={event.onlineUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline font-medium"
                        >
                          Join Online Event
                        </a>
                        <p className="text-sm text-muted-foreground mt-1">
                          Meeting link will be available to confirmed attendees
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Attendees */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Attendees
                  <span className="text-sm font-normal text-muted-foreground">
                    ({event._count.rsvps} {event.capacity ? `/ ${event.capacity}` : ""})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {event.rsvps.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-3 text-muted-foreground">No attendees yet</p>
                    {canRSVP && (
                      <p className="text-sm text-muted-foreground">Be the first to RSVP!</p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {event.rsvps.map((rsvp) => (
                      <div key={rsvp.id} className="flex flex-col items-center text-center">
                        <Avatar className="h-12 w-12 ring-2 ring-background">
                          <AvatarImage src={rsvp.membership.user.image || ""} />
                          <AvatarFallback>
                            {getInitials(rsvp.membership.user.name || rsvp.membership.user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-sm font-medium mt-2 line-clamp-1">
                          {formatAttendeeName(rsvp.membership.user)}
                        </p>
                        {rsvp.guestsCount > 0 && (
                          <p className="text-xs text-muted-foreground">
                            +{rsvp.guestsCount} guest{rsvp.guestsCount !== 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {event._count.rsvps > 8 && (
                  <div className="text-center mt-6">
                    <Button variant="link" className="text-sm">
                      View all {event._count.rsvps} attendees
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action Card */}
            <Card className="border-0 shadow-lg bg-primary/5 sticky top-24">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-primary">
                    {event.isFree ? "FREE" : `${event.currency} ${event.price}`}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {event.isFree ? "No cost to attend" : "Per person"}
                  </p>
                </div>

                {userRSVP ? (
                  <div className="space-y-4">
                    <div className="rounded-lg bg-green-50 p-4 text-center">
                      <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="font-medium text-green-800">You're going!</p>
                      {userRSVP.guestsCount > 0 && (
                        <p className="text-sm text-green-700 mt-1">
                          Bringing {userRSVP.guestsCount} guest{userRSVP.guestsCount !== 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                    <Link href={`/api/organizations/${orgSlug}/events/${event.id}/cancel-rsvp`}>
                      <Button variant="outline" className="w-full">
                        Cancel RSVP
                      </Button>
                    </Link>
                  </div>
                ) : canRSVP ? (
                  <div className="space-y-4">
                    <Link href={`/api/organizations/${orgSlug}/events/${event.id}/rsvp`}>
                      <Button className="w-full" size="lg">
                        RSVP to Event
                      </Button>
                    </Link>
                    <p className="text-xs text-center text-muted-foreground">
                      {isMemberOnly && !membership 
                        ? "This event is for members only" 
                        : isFull 
                          ? "Event is at full capacity" 
                          : "Secure your spot now"}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg bg-muted p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      {isPast 
                        ? "This event has ended" 
                        : !isUpcoming 
                          ? "Registration not yet open" 
                          : isFull 
                            ? "Event is full" 
                            : "Registration closed"}
                    </p>
                  </div>
                )}

                {/* Event Stats */}
                <div className="mt-6 pt-6 border-t space-y-3">
                  {event.capacity && (
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Capacity</span>
                        <span>{event._count.rsvps} / {event.capacity}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${(event._count.rsvps / event.capacity) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tickets Available</span>
                    <span className="font-medium">{event.tickets.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-medium">
                      {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60))} hours
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tickets Card */}
            {event.tickets.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Ticket className="h-4 w-4" />
                    Tickets
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {event.tickets.map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
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

            {/* Organizer */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Organizer</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={event.creator.image || ""} />
                  <AvatarFallback>
                    {getInitials(event.creator.name || event.creator.email)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{event.creator.name || "Organization"}</p>
                  <p className="text-sm text-muted-foreground">{organization.name}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}