import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requirePlatformAdmin } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    await requirePlatformAdmin()

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "10")
    const status = searchParams.get("status")
    const type = searchParams.get("type")
    const organizationId = searchParams.get("organizationId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const where: any = {}

    if (status) {
      where.status = status
    }

    if (type) {
      where.type = type
    }

    if (organizationId) {
      where.organizationId = organizationId
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
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
              slug: true,
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

    const stats = await prisma.ticket.aggregate({
      where,
      _sum: {
        soldQuantity: true,
        totalQuantity: true,
      },
      _avg: {
        price: true,
      },
    })

    return NextResponse.json({
      tickets,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      stats: {
        totalTickets: stats._sum.totalQuantity || 0,
        totalSold: stats._sum.soldQuantity || 0,
        averagePrice: stats._avg.price || 0,
        soldPercentage: stats._sum.totalQuantity 
          ? ((stats._sum.soldQuantity || 0) / stats._sum.totalQuantity) * 100 
          : 0,
      },
    })
  } catch (error) {
    console.error("Error fetching admin tickets:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    await requirePlatformAdmin()

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
      organizationId,
      houseId,
      eventId,
      createdBy,
    } = body

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
        organizationId,
        houseId,
        eventId,
        createdBy,
      },
    })

    return NextResponse.json(ticket, { status: 201 })
  } catch (error) {
    console.error("Error creating admin ticket:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}