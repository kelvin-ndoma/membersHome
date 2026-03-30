import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/db"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Home, Users, Calendar, Ticket, Building2, Eye, EyeOff } from "lucide-react"
import { format } from "date-fns"

interface HousePageProps {
  params: Promise<{ houseId: string }>
}

export default async function HouseDetailPage({ params }: HousePageProps) {
  const { houseId } = await params

  const house = await prisma.house.findUnique({
    where: { id: houseId },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
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
                },
              },
            },
          },
        },
      },
      events: {
        take: 5,
        orderBy: { startDate: "desc" },
        select: {
          id: true,
          title: true,
          startDate: true,
          status: true,
          _count: {
            select: { rsvps: true },
          },
        },
      },
    },
  })

  if (!house) {
    notFound()
  }

  const stats = [
    { title: "Members", value: house._count.members, icon: Users },
    { title: "Events", value: house._count.events, icon: Calendar },
    { title: "Tickets", value: house._count.tickets, icon: Ticket },
    { title: "Communications", value: house._count.communications, icon: Building2 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Home className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-2xl font-bold tracking-tight">{house.name}</h1>
            {house.isPrivate ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <p className="text-muted-foreground">{house.slug}</p>
          <p className="text-sm">
            Organization:{" "}
            <Link href={`/admin/organizations/${house.organization.id}`} className="text-primary hover:underline">
              {house.organization.name}
            </Link>
          </p>
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

      <Card>
        <CardHeader>
          <CardTitle>House Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{house.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Slug</p>
              <p className="font-medium">{house.slug}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Visibility</p>
              <p className="font-medium">{house.isPrivate ? "Private" : "Public"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">{format(new Date(house.createdAt), "MMM d, yyyy")}</p>
            </div>
          </div>
          {house.description && (
            <div>
              <p className="text-sm text-muted-foreground">Description</p>
              <p className="mt-1">{house.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {house.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div>
                    <p className="font-medium">{member.membership.user.name}</p>
                    <p className="text-sm text-muted-foreground">{member.membership.user.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{member.role}</p>
                    <p className="text-xs text-muted-foreground">
                      Joined {format(new Date(member.joinedAt), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              ))}
              {house.members.length === 0 && (
                <p className="text-center text-muted-foreground">No members yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {house.events.map((event) => (
                <div key={event.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div>
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(event.startDate), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{event._count.rsvps} RSVPs</p>
                    <p className="text-xs text-muted-foreground">{event.status}</p>
                  </div>
                </div>
              ))}
              {house.events.length === 0 && (
                <p className="text-center text-muted-foreground">No events yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}