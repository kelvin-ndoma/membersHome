import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { generateTicketCode } from "@/lib/utils/tokens"
import { sendTicketPurchaseEmail } from "@/lib/email"

export async function POST(
  req: Request,
  { params }: { params: { ticketId: string } }
) {
  try {
    const body = await req.json()
    const { quantity, customerName, customerEmail, customerPhone, membershipId } = body

    if (!customerEmail) {
      return NextResponse.json(
        { error: "Customer email is required" },
        { status: 400 }
      )
    }

    const ticket = await prisma.ticket.findFirst({
      where: {
        id: params.ticketId,
        isPublic: true,
        status: "ACTIVE",
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      )
    }

    const now = new Date()

    if (now < ticket.salesStartAt) {
      return NextResponse.json(
        { error: "Ticket sales have not started yet" },
        { status: 400 }
      )
    }

    if (now > ticket.salesEndAt) {
      return NextResponse.json(
        { error: "Ticket sales have ended" },
        { status: 400 }
      )
    }

    const availableQuantity = ticket.totalQuantity - ticket.soldQuantity - ticket.reservedQuantity
    if (availableQuantity < quantity) {
      return NextResponse.json(
        { error: `Only ${availableQuantity} tickets available` },
        { status: 400 }
      )
    }

    if (quantity > ticket.maxPerPurchase) {
      return NextResponse.json(
        { error: `Maximum ${ticket.maxPerPurchase} tickets per purchase` },
        { status: 400 }
      )
    }

    let isMember = false
    if (membershipId) {
      const membership = await prisma.membership.findFirst({
        where: {
          id: membershipId,
          organizationId: ticket.organizationId,
          status: "ACTIVE",
        },
      })
      isMember = !!membership
    }

    if (ticket.memberOnly && !isMember) {
      return NextResponse.json(
        { error: "This ticket is only available to members" },
        { status: 400 }
      )
    }

    let unitPrice = ticket.price
    const isEarlyBird = now < new Date(ticket.salesStartAt.getTime() + 7 * 24 * 60 * 60 * 1000)

    if (isMember && ticket.memberPrice !== null && ticket.memberPrice !== undefined) {
      unitPrice = ticket.memberPrice
    } else if (isEarlyBird && ticket.earlyBirdPrice !== null && ticket.earlyBirdPrice !== undefined) {
      unitPrice = ticket.earlyBirdPrice
    }

    const totalAmount = unitPrice * quantity
    const ticketCodes = Array(quantity).fill(null).map(() => generateTicketCode())

    const purchase = await prisma.$transaction(async (tx) => {
      const purchaseRecord = await tx.ticketPurchase.create({
        data: {
          ticketId: ticket.id,
          organizationId: ticket.organizationId,
          houseId: ticket.houseId,
          membershipId,
          quantity,
          unitPrice,
          totalAmount,
          currency: ticket.currency,
          customerName,
          customerEmail,
          customerPhone,
          paymentStatus: "PENDING",
          ticketCodes,
          usedCount: 0,
          fullyUsed: false,
        },
      })

      await tx.ticket.update({
        where: { id: ticket.id },
        data: {
          reservedQuantity: { increment: quantity },
        },
      })

      return purchaseRecord
    })

    await sendTicketPurchaseEmail(
      customerEmail,
      ticket.name,
      quantity,
      totalAmount,
      ticketCodes,
      undefined,
      undefined,
      `${process.env.NEXT_PUBLIC_APP_URL}/tickets/${purchase.id}`
    )

    return NextResponse.json({
      purchaseId: purchase.id,
      ticketCodes,
      totalAmount,
      unitPrice,
      message: "Ticket purchase initiated. Please complete payment.",
    })
  } catch (error) {
    console.error("Error purchasing ticket:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}