import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const session = await requireAuth()

    const body = await req.json()
    const { ticketCode, entryPoint, gateNumber, isReentry, validatorMembershipId } = body

    if (!ticketCode) {
      return NextResponse.json(
        { error: "Ticket code is required" },
        { status: 400 }
      )
    }

    const allPurchases = await prisma.ticketPurchase.findMany({
      include: {
        ticket: {
          include: {
            organization: true,
          },
        },
      },
    })

    let purchase = null
    for (const p of allPurchases) {
      const codes = p.ticketCodes as string[] || []
      if (codes.includes(ticketCode)) {
        purchase = p
        break
      }
    }

    if (!purchase) {
      return NextResponse.json(
        { error: "Invalid ticket code" },
        { status: 404 }
      )
    }

    const validations = await prisma.ticketValidation.findMany({
      where: { purchaseId: purchase.id },
    })

    const now = new Date()
    const ticket = purchase.ticket

    if (ticket.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Ticket is not active" },
        { status: 400 }
      )
    }

    if (now < ticket.validFrom) {
      return NextResponse.json(
        { error: "Ticket not yet valid" },
        { status: 400 }
      )
    }

    if (now > ticket.validUntil) {
      return NextResponse.json(
        { error: "Ticket has expired" },
        { status: 400 }
      )
    }

    if (purchase.fullyUsed) {
      return NextResponse.json(
        { error: "Ticket has been fully used" },
        { status: 400 }
      )
    }

    if (!isReentry && purchase.usedCount >= purchase.quantity) {
      return NextResponse.json(
        { error: "All tickets have been used" },
        { status: 400 }
      )
    }

    if (isReentry) {
      const lastValidation = validations[validations.length - 1]
      if (!lastValidation || lastValidation.isReentry) {
        return NextResponse.json(
          { error: "No previous entry found for reentry" },
          { status: 400 }
        )
      }
    }

    const validation = await prisma.ticketValidation.create({
      data: {
        ticketId: purchase.ticketId,
        purchaseId: purchase.id,
        validatorMembershipId,
        ticketCode,
        attendeeName: body.attendeeName,
        attendeeEmail: body.attendeeEmail,
        entryPoint,
        gateNumber,
        isValid: true,
        isReentry: isReentry || false,
      },
    })

    const newUsedCount = purchase.usedCount + 1
    const fullyUsed = newUsedCount >= purchase.quantity

    await prisma.ticketPurchase.update({
      where: { id: purchase.id },
      data: {
        usedCount: newUsedCount,
        fullyUsed,
      },
    })

    if (!isReentry) {
      await prisma.ticket.update({
        where: { id: purchase.ticketId },
        data: {
          soldQuantity: { increment: 1 },
          reservedQuantity: { decrement: 1 },
        },
      })
    }

    return NextResponse.json({
      valid: true,
      ticketName: ticket.name,
      ticketType: ticket.type,
      organizationName: ticket.organization.name,
      attendeeName: body.attendeeName,
      validatedAt: validation.validatedAt,
      isReentry: isReentry || false,
      usedCount: newUsedCount,
      totalQuantity: purchase.quantity,
    })
  } catch (error) {
    console.error("Error validating ticket:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}