import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  req: Request,
  { params }: { params: { ticketId: string } }
) {
  try {
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
            slug: true,
            logoUrl: true,
            primaryColor: true,
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
            description: true,
            startDate: true,
            endDate: true,
            location: true,
            onlineUrl: true,
            type: true,
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
    const availableQuantity = ticket.totalQuantity - ticket.soldQuantity - ticket.reservedQuantity
    const isAvailable = ticket.status === "ACTIVE" && 
                        now >= ticket.salesStartAt && 
                        now <= ticket.salesEndAt && 
                        availableQuantity > 0

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
      isAvailable,
      organization: ticket.organization,
      house: ticket.house,
      event: ticket.event,
    })
  } catch (error) {
    console.error("Error fetching public ticket:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}