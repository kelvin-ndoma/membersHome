import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireHouseAccess } from "@/lib/auth"
import { validateTicket } from "@/lib/tickets/validator"

export async function POST(
  req: Request,
  { params }: { params: { orgSlug: string; houseSlug: string; ticketId: string } }
) {
  try {
    const { houseMembership } = await requireHouseAccess(params.orgSlug, params.houseSlug)

    const body = await req.json()
    const { ticketCode, entryPoint, gateNumber, isReentry } = body

    const purchase = await prisma.ticketPurchase.findFirst({
      where: {
        ticketId: params.ticketId,
      },
      include: {
        ticket: true,
        validations: true,
      },
    })

    if (!purchase) {
      return NextResponse.json(
        { error: "Invalid ticket code" },
        { status: 404 }
      )
    }

    const ticketCodes = purchase.ticketCodes as string[] || []
    const isValidCode = ticketCodes.some((code: string) => code === ticketCode)
    
    if (!isValidCode) {
      return NextResponse.json(
        { error: "Invalid ticket code" },
        { status: 404 }
      )
    }

    const validationResult = validateTicket(
      {
        ...purchase.ticket,
        purchase: {
          ...purchase,
          usedCount: purchase.usedCount,
          quantity: purchase.quantity,
          fullyUsed: purchase.fullyUsed,
        },
        validations: purchase.validations,
      } as any,
      isReentry
    )

    if (!validationResult.isValid) {
      return NextResponse.json(
        { error: validationResult.reason },
        { status: 400 }
      )
    }

    const validation = await prisma.ticketValidation.create({
      data: {
        ticketId: params.ticketId,
        purchaseId: purchase.id,
        validatorMembershipId: houseMembership.id,
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
        where: { id: params.ticketId },
        data: {
          soldQuantity: { increment: 1 },
          reservedQuantity: { decrement: 1 },
        },
      })
    }

    return NextResponse.json({
      valid: true,
      ticketName: purchase.ticket.name,
      attendeeName: body.attendeeName,
      validatedAt: validation.validatedAt,
      isReentry: isReentry || false,
    })
  } catch (error) {
    console.error("Error validating ticket:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}