import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireOrgAccess } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: { orgSlug: string } }
) {
  try {
    await requireOrgAccess(params.orgSlug)

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "10")
    const status = searchParams.get("status")
    const type = searchParams.get("type")
    const houseId = searchParams.get("houseId")
    const eventId = searchParams.get("eventId")

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
      organizationId: organization.id,
    }

    if (status) {
      where.status = status
    }

    if (type) {
      where.type = type
    }

    if (houseId) {
      where.houseId = houseId
    }

    if (eventId) {
      where.eventId = eventId
    }

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          house: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          event: {
            select: {
              id: true,
              title: true,
            },
          },
          _count: {
            select: {
              purchases: true,
              validations: true,
            },
          },
        },
      }),
      prisma.ticket.count({ where }),
    ])

    return NextResponse.json({
      tickets,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error("Error fetching tickets:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(
  req: Request,
  { params }: { params: { orgSlug: string } }
) {
  try {
    const { membership } = await requireOrgAccess(params.orgSlug)

    const body = await req.json()
    const {
      name,
      description,
      type,
      price,
      currency,
      totalQuantity,
      maxPerPurchase,
      memberOnly,
      salesStartAt,
      salesEndAt,
      validFrom,
      validUntil,
      isPublic,
      houseId,
      eventId,
      earlyBirdPrice,
      memberPrice,
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

    const ticket = await prisma.ticket.create({
      data: {
        name,
        description,
        type: type || "GENERAL_ADMISSION",
        price,
        currency: currency || "USD",
        totalQuantity,
        soldQuantity: 0,
        reservedQuantity: 0,
        maxPerPurchase: maxPerPurchase || 10,
        memberOnly: memberOnly || false,
        salesStartAt: new Date(salesStartAt),
        salesEndAt: new Date(salesEndAt),
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        isPublic: isPublic !== false,
        isRefundable: true,
        status: "ACTIVE",
        organizationId: organization.id,
        houseId,
        eventId,
        earlyBirdPrice,
        memberPrice,
        createdBy: membership.userId,
      },
    })

    return NextResponse.json(ticket, { status: 201 })
  } catch (error) {
    console.error("Error creating ticket:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}