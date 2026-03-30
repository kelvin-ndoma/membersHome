import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireOrgAccess } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: { orgSlug: string; eventId: string } }
) {
  try {
    await requireOrgAccess(params.orgSlug)

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
      include: {
        house: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tickets: {
          where: { status: "ACTIVE" },
        },
        rsvps: {
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
        _count: {
          select: {
            rsvps: true,
            tickets: true,
          },
        },
      },
    })

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(event)
  } catch (error) {
    console.error("Error fetching event:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { orgSlug: string; eventId: string } }
) {
  try {
    const { membership } = await requireOrgAccess(params.orgSlug)

    const body = await req.json()
    const {
      title,
      description,
      startDate,
      endDate,
      location,
      address,
      onlineUrl,
      type,
      isFree,
      capacity,
      price,
      status,
    } = body

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

    const event = await prisma.event.update({
      where: {
        id: params.eventId,
        organizationId: organization.id,
      },
      data: {
        title,
        description,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        location,
        address,
        onlineUrl,
        type,
        isFree,
        capacity,
        price,
        status,
        publishedAt: status === "PUBLISHED" ? new Date() : undefined,
      },
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error("Error updating event:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    await prisma.event.update({
      where: {
        id: params.eventId,
        organizationId: organization.id,
      },
      data: { status: "CANCELLED" },
    })

    return NextResponse.json(
      { message: "Event cancelled successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error cancelling event:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}