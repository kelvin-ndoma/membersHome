import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireHouseAccess } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: { orgSlug: string; houseSlug: string } }
) {
  try {
    await requireHouseAccess(params.orgSlug, params.houseSlug)

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "10")
    const status = searchParams.get("status")
    const upcoming = searchParams.get("upcoming") === "true"

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

    const house = await prisma.house.findUnique({
      where: {
        organizationId_slug: {
          organizationId: organization.id,
          slug: params.houseSlug,
        },
      },
      select: { id: true },
    })

    if (!house) {
      return NextResponse.json(
        { error: "House not found" },
        { status: 404 }
      )
    }

    const where: any = {
      houseId: house.id,
    }

    if (status) {
      where.status = status
    }

    if (upcoming) {
      where.startDate = { gte: new Date() }
      where.status = "PUBLISHED"
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { startDate: "asc" },
        include: {
          creator: {
            select: { name: true, email: true },
          },
          _count: { select: { rsvps: true, tickets: true } },
        },
      }),
      prisma.event.count({ where }),
    ])

    return NextResponse.json({
      events,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error("Error fetching house events:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}