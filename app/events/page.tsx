import { Suspense } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { Calendar, MapPin, Users, Search, Filter } from "lucide-react"
import { prisma } from "@/lib/db"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Navbar } from "@/components/marketing/Navbar"
import { Footer } from "@/components/marketing/Footer"

interface EventsPageProps {
  searchParams: Promise<{
    search?: string
    type?: string
    date?: string
    page?: string
  }>
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const params = await searchParams
  const page = parseInt(params.page || "1")
  const pageSize = 12
  const search = params.search || ""
  const eventType = params.type || "all"
  const dateFilter = params.date || "all"

  // Build where clause
  const where: any = {
    status: "PUBLISHED",
    startDate: { gte: new Date() }, // Only show future events
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { organization: { name: { contains: search, mode: "insensitive" } } },
    ]
  }

  if (eventType !== "all") {
    where.type = eventType
  }

  if (dateFilter === "today") {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    where.startDate = { gte: today, lt: tomorrow }
  } else if (dateFilter === "week") {
    const weekStart = new Date()
    const weekEnd = new Date()
    weekEnd.setDate(weekEnd.getDate() + 7)
    where.startDate = { gte: weekStart, lte: weekEnd }
  } else if (dateFilter === "month") {
    const monthStart = new Date()
    const monthEnd = new Date()
    monthEnd.setMonth(monthEnd.getMonth() + 1)
    where.startDate = { gte: monthStart, lte: monthEnd }
  }

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { startDate: "asc" },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
          },
        },
        house: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: { rsvps: true },
        },
      },
    }),
    prisma.event.count({ where }),
  ])

  const totalPages = Math.ceil(total / pageSize)

  const eventTypes = [
    { value: "all", label: "All Types" },
    { value: "IN_PERSON", label: "In Person" },
    { value: "ONLINE", label: "Online" },
    { value: "HYBRID", label: "Hybrid" },
  ]

  const dateOptions = [
    { value: "all", label: "All Dates" },
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
  ]

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "IN_PERSON":
        return "📍"
      case "ONLINE":
        return "💻"
      case "HYBRID":
        return "🔄"
      default:
        return "📅"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto max-w-7xl px-4 py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Upcoming Events</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Discover and join events from communities around the world
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          <form method="GET" className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="search"
                placeholder="Search events by title, description, or organization..."
                defaultValue={search}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <select
                name="type"
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                defaultValue={eventType}
              >
                {eventTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <select
                name="date"
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                defaultValue={dateFilter}
              >
                {dateOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Button type="submit">
                <Filter className="mr-2 h-4 w-4" />
                Apply
              </Button>
            </div>
          </form>
        </div>

        {/* Events Grid */}
        {events.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No events found</h3>
              <p className="mt-2 text-muted-foreground">
                {search || eventType !== "all" || dateFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Check back soon for upcoming events"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {events.map((event) => (
                <Link key={event.id} href={`/events/${event.organization.slug}/${event.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
                    {event.imageUrl && (
                      <div className="h-40 overflow-hidden">
                        <img
                          src={event.imageUrl}
                          alt={event.title}
                          className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <CardHeader className={!event.imageUrl ? "pt-6" : ""}>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg line-clamp-2 flex-1">
                          {event.title}
                        </CardTitle>
                        {event.memberOnly && (
                          <Badge variant="outline" className="shrink-0 gap-1">
                            🔒 Members
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {event.organization.logoUrl ? (
                          <img
                            src={event.organization.logoUrl}
                            alt={event.organization.name}
                            className="h-4 w-4 rounded-full"
                          />
                        ) : (
                          <span className="text-xs">🏢</span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {event.organization.name}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4 shrink-0" />
                          <span className="line-clamp-1">
                            {format(new Date(event.startDate), "MMM d, yyyy • h:mm a")}
                          </span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4 shrink-0" />
                            <span className="line-clamp-1">{event.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-4 w-4 shrink-0" />
                          <span>{event._count.rsvps} attending</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{getTypeIcon(event.type)}</span>
                          <span className="text-xs text-muted-foreground">
                            {event.type.replace("_", " ")}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        {event.isFree ? (
                          <Badge variant="secondary">Free</Badge>
                        ) : (
                          <Badge variant="default">${event.price}</Badge>
                        )}
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
                  <Link
                    key={p}
                    href={`?page=${p}&search=${search}&type=${eventType}&date=${dateFilter}`}
                    className={`px-3 py-1 rounded ${
                      p === page
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {p}
                  </Link>
                ))}
                {totalPages > 10 && (
                  <>
                    <span>...</span>
                    <Link
                      href={`?page=${totalPages}&search=${search}&type=${eventType}&date=${dateFilter}`}
                      className="px-3 py-1 rounded bg-muted hover:bg-muted/80"
                    >
                      {totalPages}
                    </Link>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}