import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/options"
import { prisma } from "@/prisma/client"

export async function GET(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string; eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orgSlug, houseSlug, eventId } = params

    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug }
    })

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organizationId: organization.id,
        organizationRole: "ORG_OWNER",
        status: "ACTIVE"
      }
    })

    if (!membership) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tickets = await prisma.ticket.findMany({
      where: { eventId },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(tickets)
  } catch (error) {
    console.error("Failed to fetch tickets:", error)
    return NextResponse.json(
      { error: "Failed to fetch tickets" },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string; eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orgSlug, houseSlug, eventId } = params
    const body = await req.json()
    const {
      name, description, type, price, totalQuantity, maxPerPurchase,
      memberOnly, requiresApproval, salesStartAt, salesEndAt,
      validFrom, validUntil, isPublic, isRefundable
    } = body

    if (!name || !salesStartAt || !salesEndAt || !validFrom || !validUntil) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug }
    })

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organizationId: organization.id,
        organizationRole: "ORG_OWNER",
        status: "ACTIVE"
      }
    })

    if (!membership) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const house = await prisma.house.findFirst({
      where: {
        slug: houseSlug,
        organizationId: organization.id
      }
    })

    if (!house) {
      return NextResponse.json({ error: "House not found" }, { status: 404 })
    }

    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        houseId: house.id
      }
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

    const ticket = await prisma.ticket.create({
      data: {
        name,
        description: description || null,
        slug,
        type: type || "GENERAL_ADMISSION",
        price: price || 0,
        totalQuantity: totalQuantity || 100,
        maxPerPurchase: maxPerPurchase || 10,
        memberOnly: memberOnly || false,
        requiresApproval: requiresApproval || false,
        salesStartAt: new Date(salesStartAt),
        salesEndAt: new Date(salesEndAt),
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        isPublic: isPublic ?? true,
        isRefundable: isRefundable ?? true,
        status: "DRAFT",
        organizationId: organization.id,
        houseId: house.id,
        eventId: event.id,
        createdBy: session.user.id,
      }
    })

    return NextResponse.json(ticket, { status: 201 })
  } catch (error) {
    console.error("Failed to create ticket:", error)
    return NextResponse.json(
      { error: "Failed to create ticket" },
      { status: 500 }
    )
  }
}