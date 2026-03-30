import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireOrgAccess } from "@/lib/auth"

export async function POST(
  req: Request,
  { params }: { params: { orgSlug: string; eventId: string } }
) {
  try {
    const { membership } = await requireOrgAccess(params.orgSlug)

    const body = await req.json()
    const { status, guestsCount, notes } = body

    const organization = await prisma.organization.findUnique({
      where: { slug: params.orgSlug },
      select: { id: true },
    })

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    const event = await prisma.event.findFirst({
      where: {
        id: params.eventId,
        organizationId: organization.id,
      },
    })

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      )
    }

    const existingRSVP = await prisma.rSVP.findUnique({
      where: {
        eventId_membershipId: {
          eventId: params.eventId,
          membershipId: membership.id,
        },
      },
    })

    let rsvp

    if (existingRSVP) {
      rsvp = await prisma.rSVP.update({
        where: { id: existingRSVP.id },
        data: {
          status: status || existingRSVP.status,
          guestsCount: guestsCount !== undefined ? guestsCount : existingRSVP.guestsCount,
          notes: notes !== undefined ? notes : existingRSVP.notes,
        },
      })
    } else {
      rsvp = await prisma.rSVP.create({
        data: {
          eventId: params.eventId,
          membershipId: membership.id,
          organizationId: organization.id,
          houseId: event.houseId,
          status: status || "CONFIRMED",
          guestsCount: guestsCount || 0,
          notes,
        },
      })
    }

    return NextResponse.json(rsvp, { status: 201 })
  } catch (error) {
    console.error("Error creating/updating RSVP:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(
  req: Request,
  { params }: { params: { orgSlug: string; eventId: string } }
) {
  try {
    const { membership } = await requireOrgAccess(params.orgSlug)

    const organization = await prisma.organization.findUnique({
      where: { slug: params.orgSlug },
      select: { id: true },
    })

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    const rsvp = await prisma.rSVP.findUnique({
      where: {
        eventId_membershipId: {
          eventId: params.eventId,
          membershipId: membership.id,
        },
      },
    })

    return NextResponse.json(rsvp || null)
  } catch (error) {
    console.error("Error fetching RSVP:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}