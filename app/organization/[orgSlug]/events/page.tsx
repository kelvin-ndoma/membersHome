import { Suspense } from "react"
import Link from "next/link"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { EventCard } from "@/components/events/EventCard"
import { Plus, Search, CalendarIcon } from "lucide-react"

interface EventsPageProps {
  params: Promise<{ orgSlug: string }>
  searchParams: Promise<{ search?: string; page?: string; status?: string }>
}

export default async function EventsPage({ params, searchParams }: EventsPageProps) {
  const session = await getServerSession(authOptions)
  const { orgSlug } = await params
  const { search = "", page = "1", status = "all" } = await searchParams

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

  const pageNum = parseInt(page)
  const pageSize = 9

  const organization = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: { id: true },
  })

  if (!organization) {
    redirect("/organization")
  }

  const where: any = {
    organizationId: organization.id,
  }

  if (search) {
    where.title = { contains: search, mode: "insensitive" }
  }

  if (status !== "all") {
    where.status = status
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground">Manage and organize your organization's events</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/organization/${orgSlug}/events/calendar`}>
            <Button variant="outline">
              <CalendarIcon className="mr-2 h-4 w-4" />
              Calendar View
            </Button>
          </Link>
          {canCreate && (
            <Link href={`/organization/${orgSlug}/events/create`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Event
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <form method="GET" className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="search"
              placeholder="Search events..."
              defaultValue={search}
              className="pl-9"
            />
          </div>
        </form>
        <select
          name="status"
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          defaultValue={status}
          onChange={(e) => {
            const url = new URL(window.location.href)
            url.searchParams.set("status", e.target.value)
            window.location.href = url.toString()
          }}
        >
          <option value="all">All Events</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold">No events found</h3>
          <p className="text-muted-foreground">
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
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={{
                  ...event,
                  startDate: event.startDate,
                  endDate: event.endDate,
                }}
                onView={(id) => {
                  window.location.href = `/organization/${orgSlug}/events/${id}`
                }}
                onEdit={(id) => {
                  window.location.href = `/organization/${orgSlug}/events/${id}/manage`
                }}
                onManage={(id) => {
                  window.location.href = `/organization/${orgSlug}/events/${id}/manage`
                }}
              />
            ))}
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