// app/api/organizations/[orgSlug]/tickets/[ticketId]/purchase/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"
import { randomUUID } from "crypto"

export async function POST(
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

    const body = await req.json()
    const { quantity, customerName, customerEmail, customerPhone, membershipId } = body

    // Get the member's membership
    const membership = await prisma.membership.findFirst({
      where: {
        id: membershipId,
        userId: session.user.id,
        organization: { slug: orgSlug },
        status: "ACTIVE",
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: "Membership not found" },
        { status: 404 }
      )
    }

    // Get the ticket
    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        organization: { slug: orgSlug },
        status: "ACTIVE",
      },
    })

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      )
    }

    // Check if ticket is still available
    const availableQuantity = ticket.totalQuantity - ticket.soldQuantity - ticket.reservedQuantity
    if (availableQuantity < quantity) {
      return NextResponse.json(
        { error: "Not enough tickets available" },
        { status: 400 }
      )
    }

    // Check if sales period is valid
    const now = new Date()
    if (now < ticket.salesStartAt) {
      return NextResponse.json(
        { error: "Ticket sales haven't started yet" },
        { status: 400 }
      )
    }
    if (now > ticket.salesEndAt) {
      return NextResponse.json(
        { error: "Ticket sales have ended" },
        { status: 400 }
      )
    }

    // Generate unique ticket codes for each ticket
    const ticketCodes = Array.from({ length: quantity }, () => {
      // Generate a unique code: prefix + random UUID + timestamp
      const code = `${ticket.id.slice(0, 4)}-${randomUUID().slice(0, 8)}-${Date.now().toString().slice(-6)}`
      return code.toUpperCase()
    })

    // Calculate total amount
    const totalAmount = ticket.price * quantity

    // Create ticket purchase
    const purchase = await prisma.ticketPurchase.create({
      data: {
        ticketId,
        organizationId: membership.organizationId,
        houseId: ticket.houseId,
        membershipId,
        userId: session.user.id,
        quantity,
        unitPrice: ticket.price,
        totalAmount,
        currency: ticket.currency,
        customerName: customerName || session.user.name,
        customerEmail: customerEmail || session.user.email,
        customerPhone: customerPhone,
        paymentStatus: ticket.price === 0 ? "SUCCEEDED" : "PENDING",
        ticketCodes,
        usedCount: 0,
        fullyUsed: false,
      },
    })

    // Update ticket sold quantity
    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        soldQuantity: { increment: quantity },
        status: ticket.soldQuantity + quantity >= ticket.totalQuantity ? "SOLD_OUT" : "ACTIVE",
      },
    })

    return NextResponse.json({
      purchase,
      ticketCodes,
      totalAmount,
    }, { status: 201 })
  } catch (error) {
    console.error("Error purchasing ticket:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}