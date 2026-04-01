import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orgSlug: string; eventId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { orgSlug, eventId } = await params

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { guestsCount = 0, notes } = body

    // Get the membership
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organization: { slug: orgSlug },
        status: "ACTIVE",
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: "You must be a member of this organization to RSVP" },
        { status: 403 }
      )
    }

    // Get the event
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        organization: { slug: orgSlug },
      },
    })

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      )
    }

    // Check if event is published
    if (event.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "This event is not open for registration" },
        { status: 400 }
      )
    }

    // Check if event is in the future
    if (new Date(event.startDate) < new Date()) {
      return NextResponse.json(
        { error: "This event has already passed" },
        { status: 400 }
      )
    }

    // Check member-only restriction
    if (event.memberOnly && !membership) {
      return NextResponse.json(
        { error: "This event is for members only" },
        { status: 403 }
      )
    }

    // Check capacity
    const currentRSVPs = await prisma.rSVP.count({
      where: { eventId, status: { not: "CANCELLED" } },
    })

    const totalAttendees = currentRSVPs + guestsCount + 1
    if (event.capacity && totalAttendees > event.capacity) {
      return NextResponse.json(
        { error: `Event capacity exceeded. Only ${event.capacity - currentRSVPs} spots remaining` },
        { status: 400 }
      )
    }

    // Check if already RSVP'd
    const existingRSVP = await prisma.rSVP.findUnique({
      where: {
        eventId_membershipId: {
          eventId,
          membershipId: membership.id,
        },
      },
    })

    let rsvp

    if (existingRSVP) {
      // Update existing RSVP
      rsvp = await prisma.rSVP.update({
        where: { id: existingRSVP.id },
        data: {
          status: "CONFIRMED",
          guestsCount,
          notes,
        },
      })
    } else {
      // Create new RSVP
      rsvp = await prisma.rSVP.create({
        data: {
          eventId,
          membershipId: membership.id,
          organizationId: event.organizationId,
          houseId: event.houseId,
          status: "CONFIRMED",
          guestsCount,
          notes,
        },
      })
    }

    return NextResponse.json(rsvp, { status: 201 })
  } catch (error) {
    console.error("Error creating RSVP:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orgSlug: string; eventId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { orgSlug, eventId } = await params

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organization: { slug: orgSlug },
        status: "ACTIVE",
      },
    })

    if (!membership) {
      return NextResponse.json({ rsvp: null })
    }

    const rsvp = await prisma.rSVP.findUnique({
      where: {
        eventId_membershipId: {
          eventId,
          membershipId: membership.id,
        },
      },
    })

    return NextResponse.json({ rsvp: rsvp || null })
  } catch (error) {
    console.error("Error fetching RSVP:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ orgSlug: string; eventId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { orgSlug, eventId } = await params

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organization: { slug: orgSlug },
        status: "ACTIVE",
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: "Membership not found" },
        { status: 404 }
      )
    }

    const rsvp = await prisma.rSVP.findUnique({
      where: {
        eventId_membershipId: {
          eventId,
          membershipId: membership.id,
        },
      },
    })

    if (!rsvp) {
      return NextResponse.json(
        { error: "RSVP not found" },
        { status: 404 }
      )
    }

    await prisma.rSVP.update({
      where: { id: rsvp.id },
      data: { status: "CANCELLED" },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error cancelling RSVP:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}