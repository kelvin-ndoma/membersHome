import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Badge } from "@/components/ui/Badge"
import { Plus, Search, Calendar, MapPin, Users, Lock, Globe } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

interface EventsPageProps {
  params: Promise<{ orgSlug: string }>
  searchParams: Promise<{ search?: string; status?: string; page?: string }>
}

export default async function EventsPage({ params, searchParams }: EventsPageProps) {
  const session = await getServerSession(authOptions)
  const { orgSlug } = await params
  const { search = "", status = "all", page = "1" } = await searchParams

  if (!session?.user?.id) {
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
    redirect(`/organization/${orgSlug}/dashboard`)
  }

  const pageNum = parseInt(page)
  const pageSize = 12

  const where: any = {
    organizationId: organization.id,
  }

  if (search) {
    where.title = { contains: search, mode: "insensitive" }
  }

  if (status !== "all") {
    where.status = status.toUpperCase()
  }

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
      orderBy: { startDate: "desc" },
      include: {
        house: {
          select: { id: true, name: true, slug: true },
        },
        _count: {
          select: { rsvps: true, tickets: true },
        },
      },
    }),
    prisma.event.count({ where }),
  ])

  const totalPages = Math.ceil(total / pageSize)

  const canCreate = membership.organizationRole === "ORG_ADMIN" || membership.organizationRole === "ORG_OWNER"

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>
      case "PUBLISHED":
        return <Badge className="bg-green-100 text-green-800">Published</Badge>
      case "CANCELLED":
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>
      case "COMPLETED":
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "IN_PERSON":
        return <MapPin className="h-3 w-3" />
      case "ONLINE":
        return <Globe className="h-3 w-3" />
      case "HYBRID":
        return <Globe className="h-3 w-3" />
      default:
        return <Calendar className="h-3 w-3" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground">Manage your organization's events</p>
        </div>
        {canCreate && (
          <Link href={`/organization/${orgSlug}/events/create`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Events</CardTitle>
        </CardHeader>
        <CardContent>
          <form method="GET" className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="search"
                placeholder="Search events..."
                defaultValue={search}
                className="pl-9"
              />
            </div>
            <select
              name="status"
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              defaultValue={status}
            >
              <option value="all">All Events</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="COMPLETED">Completed</option>
            </select>
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      {events.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No events found</h3>
            <p className="mt-2 text-muted-foreground">
              {canCreate 
                ? "Create your first event to get started."
                : "No events have been created yet."}
            </p>
            {canCreate && (
              <Link href={`/organization/${orgSlug}/events/create`}>
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Event
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => {
              const isUpcoming = new Date(event.startDate) > new Date()
              const isFull = event.capacity && event._count.rsvps >= event.capacity
              
              return (
                <Link key={event.id} href={`/organization/${orgSlug}/events/${event.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl line-clamp-1">{event.title}</CardTitle>
                          {event.house && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {event.house.name}
                            </p>
                          )}
                        </div>
                        {getStatusBadge(event.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(new Date(event.startDate), "MMM d, yyyy • h:mm a")}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {getTypeIcon(event.type)}
                        <span>
                          {event.type === "IN_PERSON" ? (event.location || "In Person") : "Online"}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{event._count.rsvps} attending</span>
                          {event.capacity && (
                            <span className="text-xs">/ {event.capacity}</span>
                          )}
                        </div>
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
                      
                      {isUpcoming && event.status === "PUBLISHED" && !isFull && (
                        <div className="mt-2 text-xs text-green-600">
                          Registration open
                        </div>
                      )}
                      {isFull && (
                        <div className="mt-2 text-xs text-red-600">
                          Event is full
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={`?page=${p}&search=${search}&status=${status}`}
                  className={`px-3 py-1 rounded ${
                    p === pageNum
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {p}
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}