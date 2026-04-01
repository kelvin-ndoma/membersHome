// app/portal/[orgSlug]/dashboard/page.tsx
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Calendar, Ticket, Users, Bell, ChevronRight, Home, Building2 } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

interface DashboardPageProps {
  params: Promise<{ orgSlug: string }>
}

export default async function MemberDashboardPage({ params }: DashboardPageProps) {
  const session = await getServerSession(authOptions)
  const { orgSlug } = await params

  if (!session?.user?.id) {
    redirect(`/auth/login?callbackUrl=/portal/${orgSlug}/dashboard`)
  }

  console.log("=== Member Dashboard Debug ===")
  console.log("User ID:", session.user.id)
  console.log("Org Slug:", orgSlug)

  // Get the member's membership with house details
  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
      organization: { slug: orgSlug },
      status: "ACTIVE",
    },
    include: {
      organization: true,
      houseMemberships: {
        where: {
          status: "ACTIVE",
        },
        include: {
          house: {
            include: {
              _count: {
                select: {
                  members: true,
                  events: {
                    where: {
                      status: "PUBLISHED",
                      startDate: { gte: new Date() },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!membership) {
    console.log("No membership found")
    redirect(`/organization/${orgSlug}`)
  }

  console.log("Membership found:", {
    id: membership.id,
    organizationId: membership.organizationId,
    status: membership.status,
    houseMembershipsCount: membership.houseMemberships.length,
    houseMemberships: membership.houseMemberships.map(hm => ({
      houseId: hm.houseId,
      houseName: hm.house.name,
      status: hm.status,
      role: hm.role,
    })),
  })

  const organization = membership.organization
  const houseMemberships = membership.houseMemberships
  const houses = houseMemberships.map(hm => hm.house)
  const houseIds = houses.map(h => h.id)

  console.log("Houses found:", houses.map(h => ({ id: h.id, name: h.name })))

  // If no houses found, let's check if there are any house memberships for this user
  if (houseMemberships.length === 0) {
    console.log("WARNING: No house memberships found for this member!")
    
    // Let's check if there are any house memberships at all for this user
    const allHouseMemberships = await prisma.houseMembership.findMany({
      where: {
        membershipId: membership.id,
      },
      include: {
        house: true,
      },
    })
    
    console.log("All house memberships for this membership:", allHouseMemberships)
  }

  // Get house-specific upcoming events (events in any of the member's houses)
  const houseEvents = await prisma.event.findMany({
    where: {
      organizationId: organization.id,
      houseId: { in: houseIds.length > 0 ? houseIds : undefined },
      startDate: { gte: new Date() },
      status: "PUBLISHED",
    },
    include: {
      house: true,
      _count: {
        select: { rsvps: true },
      },
      rsvps: {
        where: {
          membershipId: membership.id,
        },
        take: 1,
      },
    },
    orderBy: { startDate: "asc" },
    take: 5,
  })

  // Get the member's RSVPs for upcoming events
  const myUpcomingRSVPs = await prisma.rSVP.findMany({
    where: {
      membershipId: membership.id,
      event: {
        startDate: { gte: new Date() },
        status: "PUBLISHED",
      },
    },
    include: {
      event: {
        include: { 
          house: true,
        },
      },
    },
    orderBy: { event: { startDate: "asc" } },
    take: 5,
  })

  // Get house-specific announcements
  const houseAnnouncements = await prisma.communication.findMany({
    where: {
      organizationId: organization.id,
      status: "SENT",
      type: "ANNOUNCEMENT",
      OR: [
        // Announcements for specific houses the member belongs to
        { houseId: { in: houseIds.length > 0 ? houseIds : undefined } },
        // Announcements for all members (no house specified)
        { houseId: null },
      ],
    },
    orderBy: { sentAt: "desc" },
    take: 5,
  })

  // Get upcoming events in the member's houses (for discovery)
  const upcomingHouseEvents = await prisma.event.findMany({
    where: {
      organizationId: organization.id,
      houseId: { in: houseIds.length > 0 ? houseIds : undefined },
      startDate: { gte: new Date() },
      status: "PUBLISHED",
    },
    include: {
      house: true,
      _count: { select: { rsvps: true } },
    },
    orderBy: { startDate: "asc" },
    take: 5,
  })

  // If member has no houses, show organization-wide events
  const discoverEvents = houseIds.length === 0 
    ? await prisma.event.findMany({
        where: {
          organizationId: organization.id,
          startDate: { gte: new Date() },
          status: "PUBLISHED",
        },
        include: {
          house: true,
          _count: { select: { rsvps: true } },
        },
        orderBy: { startDate: "asc" },
        take: 5,
      })
    : upcomingHouseEvents

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {session.user.name || "Member"}!
        </h1>
        <p className="text-muted-foreground">
          {houses.length > 0 
            ? `Your dashboard for ${houses.map(h => h.name).join(", ")} in ${organization.name}`
            : `Your dashboard for ${organization.name}`}
        </p>
        {houses.length === 0 && (
          <div className="mt-2 p-3 bg-yellow-50 text-yellow-800 rounded-md text-sm">
            ⚠️ You are not assigned to any house yet. Please contact an administrator.
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">My Houses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{houses.length}</div>
            <p className="text-xs text-muted-foreground">Active memberships</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myUpcomingRSVPs.length}</div>
            <p className="text-xs text-muted-foreground">You're attending</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">House Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{houseEvents.length}</div>
            <p className="text-xs text-muted-foreground">
              {houses.length > 0 ? "In your houses" : "In organization"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Announcements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{houseAnnouncements.length}</div>
            <p className="text-xs text-muted-foreground">New updates</p>
          </CardContent>
        </Card>
      </div>

      {/* Rest of your dashboard content... */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* My Upcoming Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              My Upcoming Events
            </CardTitle>
            <Link href={`/portal/${orgSlug}/events?filter=my`}>
              <Button variant="ghost" size="sm">
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {myUpcomingRSVPs.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">No upcoming events</p>
                <p className="text-sm text-muted-foreground">
                  Check out events in your {houses.length > 0 ? "houses" : "organization"} below
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {myUpcomingRSVPs.map((rsvp) => (
                  <div key={rsvp.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{rsvp.event.title}</p>
                        {rsvp.event.house && (
                          <Badge variant="outline" className="text-xs">
                            {rsvp.event.house.name}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(new Date(rsvp.event.startDate), "MMM d, yyyy • h:mm a")}
                      </p>
                      {rsvp.event.location && (
                        <p className="text-xs text-muted-foreground mt-1">
                          📍 {rsvp.event.location}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary">
                      {rsvp.guestsCount > 0 ? `+${rsvp.guestsCount} guests` : "Attending"}
                    </Badge>
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
              {houses.length === 1 
                ? `${houses[0].name} Announcements`
                : houses.length > 1 
                  ? "Your Houses Announcements"
                  : "Announcements"}
            </CardTitle>
            <Link href={`/portal/${orgSlug}/announcements`}>
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
                              {houses.find(h => h.id === announcement.houseId)?.name || "House"}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {announcement.body}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {format(new Date(announcement.sentAt!), "MMM d, yyyy • h:mm a")}
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
            {houses.length === 1 
              ? `Upcoming Events in ${houses[0].name}`
              : houses.length > 1
                ? "Upcoming Events in Your Houses"
                : "Upcoming Events"}
          </CardTitle>
          <Link href={`/portal/${orgSlug}/events`}>
            <Button variant="ghost" size="sm">
              View All
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {discoverEvents.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">No upcoming events</p>
              <p className="text-sm text-muted-foreground">
                {houses.length > 0 
                  ? "Check back later for events in your houses"
                  : "Check back later for events"}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {discoverEvents.map((event) => {
                const isRSVPd = myUpcomingRSVPs.some(rsvp => rsvp.eventId === event.id)
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
                        <p className="text-sm text-muted-foreground mt-1">
                          {format(new Date(event.startDate), "MMM d, yyyy • h:mm a")}
                        </p>
                        {event.house && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {event.house.name}
                          </p>
                        )}
                        {event.location && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            📍 {event.location}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {event._count.rsvps} attending
                        </p>
                      </div>
                    </div>
                    <Link href={`/portal/${orgSlug}/events/${event.id}`}>
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

      {/* My Houses Section */}
      {houses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Home className="h-4 w-4" />
              My Houses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {houses.map((house) => {
                const houseMembership = houseMemberships.find(hm => hm.houseId === house.id)
                return (
                  <Link 
                    key={house.id} 
                    href={`/portal/${orgSlug}/house/${house.slug}`}
                    className="group"
                  >
                    <div className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent hover:border-primary">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        {house.logoUrl ? (
                          <img src={house.logoUrl} alt={house.name} className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <span className="text-lg font-bold text-primary">{house.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{house.name}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {house._count.members} members
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {house._count.events} upcoming
                          </p>
                        </div>
                        {houseMembership?.role && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            {houseMembership.role.replace("HOUSE_", "").replace("_", " ")}
                          </Badge>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* If no houses, show organization info */}
      {houses.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Welcome to {organization.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You're a member of this organization. Explore events and connect with other members!
            </p>
            <div className="mt-4 flex gap-3">
              <Link href={`/portal/${orgSlug}/events`}>
                <Button>Browse Events</Button>
              </Link>
              <Link href={`/portal/${orgSlug}/profile`}>
                <Button variant="outline">Update Profile</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}