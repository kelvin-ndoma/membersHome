import { notFound } from "next/navigation"
import Link from "next/link"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Home, Users, Calendar, Ticket, User, Mail, Lock, Unlock } from "lucide-react"
import { format } from "date-fns"

interface HousePageProps {
  params: Promise<{ orgSlug: string; houseSlug: string }>
}

export default async function HouseDetailPage({ params }: HousePageProps) {
  const session = await getServerSession(authOptions)
  const { orgSlug, houseSlug } = await params

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

  const house = await prisma.house.findUnique({
    where: {
      organizationId_slug: {
        organizationId: organization.id,
        slug: houseSlug,
      },
    },
    include: {
      _count: {
        select: {
          members: true,
          events: true,
          tickets: true,
          communications: true,
        },
      },
      members: {
        take: 5,
        orderBy: { joinedAt: "desc" },
        include: {
          membership: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
        },
      },
      events: {
        take: 5,
        orderBy: { startDate: "asc" },
        where: { status: "PUBLISHED", startDate: { gte: new Date() } },
        select: {
          id: true,
          title: true,
          startDate: true,
          location: true,
          _count: { select: { rsvps: true } },
        },
      },
    },
  })

  if (!house) {
    notFound()
  }

  const userHouseMembership = await prisma.houseMembership.findFirst({
    where: {
      houseId: house.id,
      membershipId: membership.id,
    },
  })

  const isMember = !!userHouseMembership
  const userRole = userHouseMembership?.role

  const stats = [
    { title: "Members", value: house._count.members, icon: Users },
    { title: "Events", value: house._count.events, icon: Calendar },
    { title: "Tickets", value: house._count.tickets, icon: Ticket },
    { title: "Communications", value: house._count.communications, icon: Mail },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Home className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">{house.name}</h1>
            {house.isPrivate ? (
              <Badge variant="outline" className="gap-1">
                <Lock className="h-3 w-3" />
                Private
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                <Unlock className="h-3 w-3" />
                Public
              </Badge>
            )}
          </div>
          {house.description && (
            <p className="mt-1 text-muted-foreground">{house.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          {!isMember && !house.isPrivate && (
            <Link href={`/house/${orgSlug}/${houseSlug}/join`}>
              <Button>Join House</Button>
            </Link>
          )}
          {userRole === "HOUSE_ADMIN" && (
            <Link href={`/organization/${orgSlug}/houses/${houseSlug}/settings`}>
              <Button variant="outline">Manage House</Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Members</CardTitle>
          </CardHeader>
          <CardContent>
            {house.members.length === 0 ? (
              <p className="text-center text-muted-foreground">No members yet</p>
            ) : (
              <div className="space-y-4">
                {house.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{member.membership.user.name || "Unnamed"}</p>
                        <p className="text-sm text-muted-foreground">{member.membership.user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">{member.role}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        Joined {format(new Date(member.joinedAt), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {house._count.members > 5 && (
              <div className="mt-4 text-center">
                <Link href={`/house/${orgSlug}/${houseSlug}/members`}>
                  <Button variant="link">View all {house._count.members} members</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            {house.events.length === 0 ? (
              <p className="text-center text-muted-foreground">No upcoming events</p>
            ) : (
              <div className="space-y-4">
                {house.events.map((event) => (
                  <div key={event.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(event.startDate), "MMM d, yyyy • h:mm a")}
                      </p>
                      {event.location && (
                        <p className="text-xs text-muted-foreground">{event.location}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">{event._count.rsvps} RSVPs</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {house._count.events > 5 && (
              <div className="mt-4 text-center">
                <Link href={`/house/${orgSlug}/${houseSlug}/events`}>
                  <Button variant="link">View all events</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {isMember && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Link href={`/house/${orgSlug}/${houseSlug}/dashboard`}>
                <Button variant="outline" className="w-full">House Dashboard</Button>
              </Link>
              <Link href={`/house/${orgSlug}/${houseSlug}/events`}>
                <Button variant="outline" className="w-full">View Events</Button>
              </Link>
              <Link href={`/house/${orgSlug}/${houseSlug}/members`}>
                <Button variant="outline" className="w-full">View Members</Button>
              </Link>
              <Link href={`/house/${orgSlug}/${houseSlug}/tickets`}>
                <Button variant="outline" className="w-full">Buy Tickets</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}