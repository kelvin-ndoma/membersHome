// app/portal/[orgSlug]/events/page.tsx
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"
import { EventsList } from "./EventsList"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Calendar, MapPin, Users } from "lucide-react"

interface EventsPageProps {
  params: Promise<{ orgSlug: string }>
  searchParams: Promise<{ filter?: string; houseId?: string }>
}

export default async function EventsPage({ params, searchParams }: EventsPageProps) {
  const session = await getServerSession(authOptions)
  const { orgSlug } = await params
  const { filter, houseId } = await searchParams

  if (!session?.user?.id) {
    redirect(`/auth/login?callbackUrl=/portal/${orgSlug}/events`)
  }

  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
      organization: { slug: orgSlug },
      status: "ACTIVE",
    },
    include: {
      houseMemberships: {
        where: { status: "ACTIVE" },
        include: { house: true },
      },
    },
  })

  if (!membership) {
    redirect(`/organization/${orgSlug}`)
  }

  const houses = membership.houseMemberships.map(hm => hm.house)
  const houseIds = houses.map(h => h.id)

  // Build where clause for events
  let whereClause: any = {
    organizationId: membership.organizationId,
    status: "PUBLISHED",
    startDate: { gte: new Date() },
  }

  if (filter === "my") {
    // Show events the member has RSVP'd to
    const myRSVPs = await prisma.rSVP.findMany({
      where: { membershipId: membership.id },
      select: { eventId: true },
    })
    const eventIds = myRSVPs.map(rsvp => rsvp.eventId)
    whereClause.id = { in: eventIds }
  } else if (houseId) {
    // Show events for specific house
    whereClause.houseId = houseId
  } else if (houses.length > 0) {
    // Show events from member's houses
    whereClause.houseId = { in: houseIds }
  }

  const events = await prisma.event.findMany({
    where: whereClause,
    include: {
      house: true,
      _count: {
        select: { rsvps: true },
      },
    },
    orderBy: { startDate: "asc" },
  })

  // Get member's RSVPs
  const myRSVPs = await prisma.rSVP.findMany({
    where: { membershipId: membership.id },
    select: { eventId: true, guestsCount: true },
  })

  const rsvpMap = new Map(myRSVPs.map(rsvp => [rsvp.eventId, rsvp.guestsCount]))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Events</h1>
        <p className="text-muted-foreground">
          Discover and RSVP to upcoming events
        </p>
      </div>

      <EventsList
        events={events}
        membershipId={membership.id}
        orgSlug={orgSlug}
        houses={houses}
        rsvpMap={rsvpMap}
      />
    </div>
  )
}