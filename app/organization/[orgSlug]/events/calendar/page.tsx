import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"
import { CalendarView } from "@/components/events/CalendarView"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface CalendarPageProps {
  params: Promise<{ orgSlug: string }>
}

export default async function CalendarPage({ params }: CalendarPageProps) {
  const session = await getServerSession(authOptions)
  const { orgSlug } = await params

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
    redirect("/organization")
  }

  const events = await prisma.event.findMany({
    where: {
      organizationId: organization.id,
      status: { in: ["PUBLISHED", "DRAFT"] },
    },
    select: {
      id: true,
      title: true,
      startDate: true,
      endDate: true,
      type: true,
      status: true,
    },
  })

  const formattedEvents = events.map((event) => ({
    id: event.id,
    title: event.title,
    startDate: event.startDate,
    endDate: event.endDate,
    type: event.type,
    status: event.status,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Event Calendar</h1>
          <p className="text-muted-foreground">View all your events in a calendar view</p>
        </div>
        <Link href={`/organization/${orgSlug}/events`}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Button>
        </Link>
      </div>

      <CalendarView
        events={formattedEvents}
        onEventClick={(eventId) => {
          window.location.href = `/organization/${orgSlug}/events/${eventId}`
        }}
      />
    </div>
  )
}