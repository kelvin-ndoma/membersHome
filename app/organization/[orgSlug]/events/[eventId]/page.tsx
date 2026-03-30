import { notFound } from "next/navigation"
import Link from "next/link"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Calendar, MapPin, Users, Ticket, Edit, ArrowLeft, Globe, Video } from "lucide-react"
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
    select: { id: true },
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
        select: { id: true, name: true, email: true },
      },
      tickets: {
        where: { status: "ACTIVE" },
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

  const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-800",
    PUBLISHED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
    COMPLETED: "bg-blue-100 text-blue-800",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/organization/${orgSlug}/events`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{event.title}</h1>
            <div className="mt-1 flex gap-2">
              <Badge className={statusColors[event.status]}>{event.status}</Badge>
              {event.house && (
                <Link href={`/organization/${orgSlug}/houses/${event.house.slug}`}>
                  <Badge variant="outline">{event.house.name}</Badge>
                </Link>
              )}
            </div>
          </div>
        </div>
        {canManage && (
          <Link href={`/organization/${orgSlug}/events/${event.id}/manage`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Manage Event
            </Button>
          </Link>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {event.description && (
              <div>
                <h3 className="font-medium">Description</h3>
                <p className="mt-1 text-muted-foreground">{event.description}</p>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Date & Time</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(event.startDate), "EEEE, MMMM d, yyyy")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(event.startDate), "h:mm a")} - {format(new Date(event.endDate), "h:mm a")}
                  </p>
                </div>
              </div>
              {event.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">{event.location}</p>
                  </div>
                </div>
              )}
              {event.onlineUrl && (
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Online Link</p>
                    <a href={event.onlineUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                      Join Meeting
                    </a>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Attendance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total RSVPs</span>
                <span className="font-medium">{event._count.rsvps}</span>
              </div>
              {event.capacity && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Capacity</span>
                  <span className="font-medium">{event.capacity}</span>
                </div>
              )}
              {event.capacity && (
                <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${(event._count.rsvps / event.capacity) * 100}%` }}
                  />
                </div>
              )}
              <div className="mt-4">
                <Link href={`/organization/${orgSlug}/events/${event.id}/attendees`}>
                  <Button variant="outline" className="w-full">
                    <Users className="mr-2 h-4 w-4" />
                    View Attendees
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tickets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Available Tickets</span>
                <span className="font-medium">{event.tickets.length}</span>
              </div>
              {event.isFree ? (
                <Badge variant="success" className="w-full justify-center">Free Event</Badge>
              ) : (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-medium">{event.currency} {event.price}</span>
                </div>
              )}
              <div className="mt-4">
                <Link href={`/organization/${orgSlug}/events/${event.id}/tickets`}>
                  <Button variant="outline" className="w-full">
                    <Ticket className="mr-2 h-4 w-4" />
                    View Tickets
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {userRSVP ? (
            <Card>
              <CardHeader>
                <CardTitle>Your RSVP</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={userRSVP.status === "CONFIRMED" ? "success" : "secondary"} className="w-full justify-center">
                  {userRSVP.status}
                </Badge>
                {userRSVP.guestsCount > 0 && (
                  <p className="mt-2 text-center text-sm text-muted-foreground">
                    +{userRSVP.guestsCount} guest{userRSVP.guestsCount !== 1 ? "s" : ""}
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>RSVP</CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/api/organizations/${orgSlug}/events/${event.id}/rsvp`}>
                  <Button className="w-full">RSVP to Event</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}