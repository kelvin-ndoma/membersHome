// app/api/organizations/[orgSlug]/events/[eventId]/rsvp/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"

// POST - Create RSVP
export async function POST(
  req: Request,
  { params }: { params: Promise<{ orgSlug: string; eventId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { orgSlug, eventId } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { membershipId, guestsCount, notes } = body

    // Verify membership
    const membership = await prisma.membership.findFirst({
      where: {
        id: membershipId,
        userId: session.user.id,
        organization: { slug: orgSlug },
        status: "ACTIVE",
      },
    })

    if (!membership) {
      return NextResponse.json({ error: "Membership not found" }, { status: 404 })
    }

    // Check if already RSVP'd
    const existingRSVP = await prisma.rSVP.findFirst({
      where: {
        eventId,
        membershipId,
      },
    })

    if (existingRSVP) {
      return NextResponse.json({ error: "Already RSVP'd to this event" }, { status: 400 })
    }

    // Get event to check capacity
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: { rsvps: true },
        },
      },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check capacity
    if (event.capacity && event._count.rsvps >= event.capacity) {
      return NextResponse.json({ error: "Event is at capacity" }, { status: 400 })
    }

    // Create RSVP
    const rsvp = await prisma.rSVP.create({
      data: {
        eventId,
        membershipId,
        organizationId: membership.organizationId,
        houseId: event.houseId,
        guestsCount: guestsCount || 0,
        notes: notes || null,
        status: "CONFIRMED",
      },
    })

    return NextResponse.json(rsvp, { status: 201 })
  } catch (error) {
    console.error("Error creating RSVP:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH - Update RSVP
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ orgSlug: string; eventId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { orgSlug, eventId } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { membershipId, guestsCount, notes } = body

    const rsvp = await prisma.rSVP.findFirst({
      where: {
        eventId,
        membershipId,
      },
    })

    if (!rsvp) {
      return NextResponse.json({ error: "RSVP not found" }, { status: 404 })
    }

    const updated = await prisma.rSVP.update({
      where: { id: rsvp.id },
      data: {
        guestsCount: guestsCount !== undefined ? guestsCount : rsvp.guestsCount,
        notes: notes !== undefined ? notes : rsvp.notes,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating RSVP:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Cancel RSVP
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ orgSlug: string; eventId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { orgSlug, eventId } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { membershipId } = body

    const rsvp = await prisma.rSVP.findFirst({
      where: {
        eventId,
        membershipId,
      },
    })

    if (!rsvp) {
      return NextResponse.json({ error: "RSVP not found" }, { status: 404 })
    }

    await prisma.rSVP.delete({
      where: { id: rsvp.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error canceling RSVP:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}