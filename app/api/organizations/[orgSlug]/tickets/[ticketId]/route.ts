// app/api/organizations/[orgSlug]/tickets/[ticketId]/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"

// GET - Fetch a single ticket
export async function GET(
  req: Request,
  { params }: { params: Promise<{ orgSlug: string; ticketId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { orgSlug, ticketId } = await params

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

    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        organizationId: organization.id,
      },
      include: {
        house: {
          select: { id: true, name: true, slug: true },
        },
        event: {
          select: { id: true, title: true, startDate: true, endDate: true },
        },
        _count: {
          select: { purchases: true, validations: true },
        },
      },
    })

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(ticket)
  } catch (error) {
    console.error("Error fetching ticket:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH - Update a ticket
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ orgSlug: string; ticketId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { orgSlug, ticketId } = await params

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

    const existingTicket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        organizationId: organization.id,
      },
    })

    if (!existingTicket) {
      return NextResponse.json(
        { error: "Ticket not found" },
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
      status,
    } = body

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        name: name !== undefined ? name : existingTicket.name,
        description: description !== undefined ? description : existingTicket.description,
        type: type !== undefined ? type : existingTicket.type,
        price: price !== undefined ? price : existingTicket.price,
        currency: currency !== undefined ? currency : existingTicket.currency,
        totalQuantity: totalQuantity !== undefined ? totalQuantity : existingTicket.totalQuantity,
        maxPerPurchase: maxPerPurchase !== undefined ? maxPerPurchase : existingTicket.maxPerPurchase,
        memberOnly: memberOnly !== undefined ? memberOnly : existingTicket.memberOnly,
        requiresApproval: requiresApproval !== undefined ? requiresApproval : existingTicket.requiresApproval,
        salesStartAt: salesStartAt !== undefined ? new Date(salesStartAt) : existingTicket.salesStartAt,
        salesEndAt: salesEndAt !== undefined ? new Date(salesEndAt) : existingTicket.salesEndAt,
        validFrom: validFrom !== undefined ? new Date(validFrom) : existingTicket.validFrom,
        validUntil: validUntil !== undefined ? new Date(validUntil) : existingTicket.validUntil,
        eventId: eventId !== undefined ? eventId : existingTicket.eventId,
        status: status !== undefined ? status : existingTicket.status,
      },
    })

    return NextResponse.json(updatedTicket)
  } catch (error) {
    console.error("Error updating ticket:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - Delete a ticket
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ orgSlug: string; ticketId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { orgSlug, ticketId } = await params

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

    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        organizationId: organization.id,
      },
      include: {
        _count: {
          select: { purchases: true },
        },
      },
    })

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      )
    }

    if (ticket._count.purchases > 0) {
      return NextResponse.json(
        { error: "Cannot delete ticket with existing purchases" },
        { status: 400 }
      )
    }

    await prisma.ticket.delete({
      where: { id: ticketId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting ticket:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}