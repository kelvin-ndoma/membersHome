// app/api/organizations/[orgSlug]/tickets/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"

// GET - List tickets for a house
export async function GET(
  req: Request,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { orgSlug } = await params

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: { id: true },
    })

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(req.url)
    const houseId = searchParams.get("houseId")
    const eventId = searchParams.get("eventId")

    const where: any = {
      organizationId: organization.id,
    }

    if (houseId) {
      where.houseId = houseId
    }

    if (eventId) {
      where.eventId = eventId
    }

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        house: {
          select: { id: true, name: true, slug: true },
        },
        event: {
          select: { id: true, title: true, startDate: true },
        },
        _count: {
          select: { purchases: true, validations: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ tickets })
  } catch (error) {
    console.error("Error fetching tickets:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Create a new ticket
export async function POST(
  req: Request,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { orgSlug } = await params

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
        organizationRole: { in: ["ORG_ADMIN", "ORG_OWNER"] },
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: { id: true },
    })

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

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
      requiresApproval,
      salesStartAt,
      salesEndAt,
      validFrom,
      validUntil,
      eventId,
      houseId,
    } = body

    // Validate house exists
    const house = await prisma.house.findFirst({
      where: {
        id: houseId,
        organizationId: organization.id,
      },
    })

    if (!house) {
      return NextResponse.json(
        { error: "House not found" },
        { status: 400 }
      )
    }

    // Validate event if provided
    if (eventId) {
      const event = await prisma.event.findFirst({
        where: {
          id: eventId,
          organizationId: organization.id,
        },
      })
      if (!event) {
        return NextResponse.json(
          { error: "Event not found" },
          { status: 400 }
        )
      }
    }

    const ticket = await prisma.ticket.create({
      data: {
        name,
        description,
        type: type || "GENERAL_ADMISSION",
        price: price || 0,
        currency: currency || "USD",
        totalQuantity,
        soldQuantity: 0,
        reservedQuantity: 0,
        maxPerPurchase: maxPerPurchase || 10,
        memberOnly: memberOnly || false,
        requiresApproval: requiresApproval || false,
        salesStartAt: new Date(salesStartAt),
        salesEndAt: new Date(salesEndAt),
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        organizationId: organization.id,
        houseId,
        eventId: eventId || null,
        createdBy: session.user.id,
        status: "ACTIVE",
        isPublic: true,
        isRefundable: true,
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