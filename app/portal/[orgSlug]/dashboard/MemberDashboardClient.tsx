// app/portal/[orgSlug]/dashboard/MemberDashboardClient.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Calendar, Bell, Users, Home, ChevronRight, MapPin, Clock } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

interface Event {
  id: string
  title: string
  startDate: Date
  location: string | null
  house: { name: string } | null
  _count: { rsvps: number }
}

interface RSVP {
  id: string
  event: Event
  guestsCount: number
}

interface Announcement {
  id: string
  subject: string
  body: string
  sentAt: Date
  houseId: string | null
}

interface MemberDashboardClientProps {
  organization: {
    id: string
    name: string
    slug: string
    logoUrl: string | null
  }
  currentHouse: {
    id: string
    name: string
    slug: string
    description: string | null
    logoUrl: string | null
  }
  membership: {
    id: string
    organizationRole: string
  }
  houseEvents: Event[]
  myRSVPs: RSVP[]
  houseAnnouncements: Announcement[]
  houseMembersCount: number
}

export function MemberDashboardClient({
  organization,
  currentHouse,
  membership,
  houseEvents,
  myRSVPs,
  houseAnnouncements,
  houseMembersCount,
}: MemberDashboardClientProps) {
  const myUpcomingEvents = myRSVPs.map(rsvp => rsvp.event)
  const rsvpEventIds = new Set(myRSVPs.map(rsvp => rsvp.event.id))

  return (
    <div className="space-y-8">
      {/* House Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            {currentHouse.logoUrl ? (
              <img
                src={currentHouse.logoUrl}
                alt={currentHouse.name}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Home className="h-6 w-6 text-primary" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{currentHouse.name}</h1>
              <p className="text-muted-foreground">
                Your house dashboard in {organization.name}
              </p>
            </div>
          </div>
          {currentHouse.description && (
            <p className="mt-2 text-muted-foreground">{currentHouse.description}</p>
          )}
        </div>
        <Link href={`/portal/${organization.slug}/house/${currentHouse.slug}`}>
          <Button variant="outline">
            View House Page
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* House Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">House Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div className="text-2xl font-bold">{houseMembersCount}</div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Active members</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div className="text-2xl font-bold">{houseEvents.length}</div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">In {currentHouse.name}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">My RSVPs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div className="text-2xl font-bold">{myUpcomingEvents.length}</div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Events you're attending</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* My Upcoming Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              My Upcoming Events
            </CardTitle>
            <Link href={`/portal/${organization.slug}/events?house=${currentHouse.id}`}>
              <Button variant="ghost" size="sm">
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {myUpcomingEvents.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">No upcoming events</p>
                <p className="text-sm text-muted-foreground">
                  Check out events below and RSVP!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {myUpcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div className="flex-1">
                      <p className="font-medium">{event.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(event.startDate), "MMM d, yyyy • h:mm a")}
                        </p>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2 mt-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">{event.location}</p>
                        </div>
                      )}
                    </div>
                    <Badge variant="secondary">Attending</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* House Announcements */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-4 w-4" />
              {currentHouse.name} Announcements
            </CardTitle>
            <Link href={`/portal/${organization.slug}/announcements?house=${currentHouse.id}`}>
              <Button variant="ghost" size="sm">
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {houseAnnouncements.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">No announcements</p>
                <p className="text-sm text-muted-foreground">
                  Check back later for updates
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {houseAnnouncements.map((announcement) => (
                  <div key={announcement.id} className="border-b pb-3 last:border-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{announcement.subject}</p>
                          {announcement.houseId && (
                            <Badge variant="outline" className="text-xs">
                              House Only
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {announcement.body}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {format(new Date(announcement.sentAt), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming House Events */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Upcoming Events in {currentHouse.name}
          </CardTitle>
          <Link href={`/portal/${organization.slug}/events?house=${currentHouse.id}`}>
            <Button variant="ghost" size="sm">
              View All
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {houseEvents.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">No upcoming events</p>
              <p className="text-sm text-muted-foreground">
                Check back later for events in your house
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {houseEvents.map((event) => {
                const isRSVPd = rsvpEventIds.has(event.id)
                return (
                  <div key={event.id} className="rounded-lg border p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{event.title}</p>
                          {isRSVPd && (
                            <Badge variant="default" className="bg-green-600">
                              RSVPd
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(event.startDate), "MMM d, h:mm a")}
                          </p>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2 mt-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {event.location}
                            </p>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {event._count.rsvps} attending
                        </p>
                      </div>
                    </div>
                    <Link href={`/portal/${organization.slug}/events/${event.id}`}>
                      <Button 
                        variant={isRSVPd ? "outline" : "default"} 
                        size="sm" 
                        className="w-full mt-3"
                      >
                        {isRSVPd ? "View Details" : "RSVP Now"}
                      </Button>
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}