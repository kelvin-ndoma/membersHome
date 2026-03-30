import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { generateTicketCode } from "@/lib/utils/tokens"
import { sendTicketPurchaseEmail } from "@/lib/email"

export async function GET(
  req: Request,
  { params }: { params: { orgSlug: string; houseSlug: string; ticketId: string } }
) {
  try {
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
      select: { id: true, name: true },
    })

    if (!house) {
      return NextResponse.json(
        { error: "House not found" },
        { status: 404 }
      )
    }

    const ticket = await prisma.ticket.findFirst({
      where: {
        id: params.ticketId,
        houseId: house.id,
        isPublic: true,
        status: "ACTIVE",
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            location: true,
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

    const availableQuantity = ticket.totalQuantity - ticket.soldQuantity - ticket.reservedQuantity

    return NextResponse.json({
      id: ticket.id,
      name: ticket.name,
      description: ticket.description,
      type: ticket.type,
      price: ticket.price,
      currency: ticket.currency,
      memberPrice: ticket.memberPrice,
      earlyBirdPrice: ticket.earlyBirdPrice,
      maxPerPurchase: ticket.maxPerPurchase,
      memberOnly: ticket.memberOnly,
      salesStartAt: ticket.salesStartAt,
      salesEndAt: ticket.salesEndAt,
      validFrom: ticket.validFrom,
      validUntil: ticket.validUntil,
      availableQuantity,
      event: ticket.event,
      houseName: house.name,
    })
  } catch (error) {
    console.error("Error fetching public ticket:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(
  req: Request,
  { params }: { params: { orgSlug: string; houseSlug: string; ticketId: string } }
) {
  try {
    const body = await req.json()
    const { quantity, customerName, customerEmail, customerPhone } = body

    const organization = await prisma.organization.findUnique({
      where: { slug: params.orgSlug },
      select: { id: true, name: true },
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
      select: { id: true, name: true },
    })

    if (!house) {
      return NextResponse.json(
        { error: "House not found" },
        { status: 404 }
      )
    }

    const ticket = await prisma.ticket.findFirst({
      where: {
        id: params.ticketId,
        houseId: house.id,
        isPublic: true,
        status: "ACTIVE",
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

    const unitPrice = ticket.price
    const totalAmount = unitPrice * quantity
    const ticketCodes = Array(quantity).fill(null).map(() => generateTicketCode())

    const purchase = await prisma.$transaction(async (tx) => {
      const purchaseRecord = await tx.ticketPurchase.create({
        data: {
          ticketId: ticket.id,
          organizationId: organization.id,
          houseId: house.id,
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
      ticket.eventId ? undefined : undefined,
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