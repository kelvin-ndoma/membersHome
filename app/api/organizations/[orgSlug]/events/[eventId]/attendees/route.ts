import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireOrgAccess } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: { orgSlug: string; eventId: string } }
) {
  try {
    await requireOrgAccess(params.orgSlug)

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "10")
    const status = searchParams.get("status")

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

    const where: any = {
      eventId: params.eventId,
      organizationId: organization.id,
    }

    if (status) {
      where.status = status
    }

    const [attendees, total] = await Promise.all([
      prisma.rSVP.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          membership: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                  phone: true,
                },
              },
            },
          },
        },
      }),
      prisma.rSVP.count({ where }),
    ])

    const stats = await prisma.rSVP.aggregate({
      where: {
        eventId: params.eventId,
        organizationId: organization.id,
      },
      _count: true,
      _sum: {
        guestsCount: true,
      },
    })

    return NextResponse.json({
      attendees: attendees.map(a => ({
        id: a.id,
        status: a.status,
        guestsCount: a.guestsCount,
        notes: a.notes,
        checkedInAt: a.checkedInAt,
        user: a.membership.user,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      stats: {
        totalRSVPs: stats._count,
        totalGuests: stats._sum.guestsCount || 0,
      },
    })
  } catch (error) {
    console.error("Error fetching attendees:", error)
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
    const { rsvpId, checkedIn } = body

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

    const rsvp = await prisma.rSVP.update({
      where: {
        id: rsvpId,
        eventId: params.eventId,
        organizationId: organization.id,
      },
      data: {
        checkedInAt: checkedIn ? new Date() : null,
        status: checkedIn ? "ATTENDED" : "CONFIRMED",
        checkedInBy: checkedIn ? membership.userId : null,
      },
    })

    return NextResponse.json(rsvp)
  } catch (error) {
    console.error("Error updating attendee check-in:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}