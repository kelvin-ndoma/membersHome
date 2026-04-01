// app/organization/[orgSlug]/houses/[houseSlug]/events/page.tsx
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Calendar, MapPin, Users, Eye, Edit, Plus, Trash2, Clock } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

interface HouseEventsPageProps {
  params: Promise<{ orgSlug: string; houseSlug: string }>
  searchParams: Promise<{ status?: string }>
}

export default async function HouseEventsPage({ params, searchParams }: HouseEventsPageProps) {
  const session = await getServerSession(authOptions)
  const { orgSlug, houseSlug } = await params
  const { status = "all" } = await searchParams

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

  const isOrgAdmin = membership.organizationRole === "ORG_ADMIN" || membership.organizationRole === "ORG_OWNER"

  if (!isOrgAdmin) {
    redirect(`/portal/${orgSlug}/dashboard`)
  }

  const organization = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: { id: true },
  })

  if (!organization) {
    notFound()
  }

  const house = await prisma.house.findFirst({
    where: {
      slug: houseSlug,
      organizationId: organization.id,
    },
  })

  if (!house) {
    notFound()
  }

  // Build where clause for events
  const where: any = {
    houseId: house.id,
    organizationId: organization.id,
  }

  if (status !== "all") {
    where.status = status.toUpperCase()
  }

  const events = await prisma.event.findMany({
    where,
    orderBy: { startDate: "desc" },
    include: {
      house: {
        select: { id: true, name: true, slug: true },
      },
      creator: {
        select: { name: true, email: true },
      },
      _count: {
        select: { rsvps: true },
      },
    },
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return <Badge className="bg-green-100 text-green-800">Published</Badge>
      case "DRAFT":
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>
      case "CANCELLED":
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>
      case "COMPLETED":
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case "IN_PERSON":
        return "In Person"
      case "ONLINE":
        return "Online"
      case "HYBRID":
        return "Hybrid"
      default:
        return type
    }
  }

  const isPastEvent = (date: Date) => {
    return new Date(date) < new Date()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">House Events</h1>
          <p className="text-muted-foreground">
            Manage events for {house.name}
          </p>
        </div>
        <Link href={`/organization/${orgSlug}/houses/${houseSlug}/events/create`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Event
          </Button>
        </Link>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2">
        <Link href={`/organization/${orgSlug}/houses/${houseSlug}/events`}>
          <Badge variant={status === "all" ? "default" : "outline"} className="cursor-pointer px-3 py-1">
            All
          </Badge>
        </Link>
        <Link href={`/organization/${orgSlug}/houses/${houseSlug}/events?status=published`}>
          <Badge variant={status === "published" ? "default" : "outline"} className="cursor-pointer px-3 py-1">
            Published
          </Badge>
        </Link>
        <Link href={`/organization/${orgSlug}/houses/${houseSlug}/events?status=draft`}>
          <Badge variant={status === "draft" ? "default" : "outline"} className="cursor-pointer px-3 py-1">
            Draft
          </Badge>
        </Link>
        <Link href={`/organization/${orgSlug}/houses/${houseSlug}/events?status=completed`}>
          <Badge variant={status === "completed" ? "default" : "outline"} className="cursor-pointer px-3 py-1">
            Completed
          </Badge>
        </Link>
        <Link href={`/organization/${orgSlug}/houses/${houseSlug}/events?status=cancelled`}>
          <Badge variant={status === "cancelled" ? "default" : "outline"} className="cursor-pointer px-3 py-1">
            Cancelled
          </Badge>
        </Link>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No events found</h3>
            <p className="mt-2 text-muted-foreground">
              Create your first event for {house.name}
            </p>
            <Link href={`/organization/${orgSlug}/houses/${houseSlug}/events/create`}>
              <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Create Event
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Card key={event.id} className="hover:shadow-lg transition-shadow overflow-hidden">
              {event.imageUrl && (
                <div className="relative w-full h-40">
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">{event.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {getEventTypeLabel(event.type)}
                      </Badge>
                      {getStatusBadge(event.status)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(new Date(event.startDate), "MMM d, yyyy • h:mm a")}
                  </span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="line-clamp-1">{event.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{event._count.rsvps} attending</span>
                </div>
                {isPastEvent(event.startDate) && event.status === "PUBLISHED" && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="text-orange-600">Past event</span>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Link href={`/organization/${orgSlug}/houses/${houseSlug}/events/${event.id}`} className="flex-1">
                    <Button variant="outline" className="w-full" size="sm">
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                  </Link>
                  <Link href={`/organization/${orgSlug}/houses/${houseSlug}/events/${event.id}/edit`} className="flex-1">
                    <Button className="w-full" size="sm">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}