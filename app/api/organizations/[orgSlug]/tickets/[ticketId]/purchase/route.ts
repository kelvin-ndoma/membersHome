import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { generateTicketCode } from "@/lib/utils/tokens"
import { sendTicketPurchaseEmail } from "@/lib/email"

export async function POST(
  req: Request,
  { params }: { params: { orgSlug: string; ticketId: string } }
) {
  try {
    const session = await requireAuth()

    const body = await req.json()
    const { quantity, customerName, customerEmail, customerPhone, membershipId } = body

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

    const ticket = await prisma.ticket.findFirst({
      where: {
        id: params.ticketId,
        organizationId: organization.id,
        status: "ACTIVE",
      },
    })

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found or not available" },
        { status: 404 }
      )
    }

    const isMember = !!membershipId
    const now = new Date()

    if (ticket.memberOnly && !isMember) {
      return NextResponse.json(
        { error: "This ticket is only available to members" },
        { status: 400 }
      )
    }

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
          organizationId: organization.id,
          houseId: ticket.houseId,
          membershipId,
          userId: session.user.id,
          quantity,
          unitPrice,
          totalAmount,
          currency: ticket.currency,
          customerName,
          customerEmail: customerEmail || session.user.email,
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
      customerEmail || session.user.email,
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
    })
  } catch (error) {
    console.error("Error purchasing ticket:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}