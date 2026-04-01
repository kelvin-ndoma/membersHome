// app/api/organizations/[orgSlug]/tickets/validate/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"

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

    // Check if user is event staff or admin
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organization: { slug: orgSlug },
        status: "ACTIVE",
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { ticketCode } = body

    // Find the ticket purchase by checking if the code exists in ticketCodes array
    // Since we're using MongoDB with Prisma, we need to fetch all purchases and filter
    const purchases = await prisma.ticketPurchase.findMany({
      where: {
        // For MongoDB, we can't use 'has' directly, so we'll fetch all and filter
      },
      include: {
        ticket: {
          include: {
            event: true,
          },
        },
      },
    })

    // Find the purchase that contains this ticket code
    const purchase = purchases.find(p => 
      p.ticketCodes && Array.isArray(p.ticketCodes) && p.ticketCodes.includes(ticketCode)
    )

    if (!purchase) {
      return NextResponse.json(
        { error: "Invalid ticket code" },
        { status: 404 }
      )
    }

    // Check if ticket is already validated
    const existingValidation = await prisma.ticketValidation.findFirst({
      where: {
        ticketCode,
      },
    })

    if (existingValidation) {
      return NextResponse.json({
        valid: false,
        message: "Ticket has already been used",
        validatedAt: existingValidation.validatedAt,
      })
    }

    // Check if ticket is within validity period
    const now = new Date()
    if (now < purchase.ticket.validFrom) {
      return NextResponse.json({
        valid: false,
        message: "Ticket is not yet valid",
        validFrom: purchase.ticket.validFrom,
      })
    }

    if (now > purchase.ticket.validUntil) {
      return NextResponse.json({
        valid: false,
        message: "Ticket has expired",
        validUntil: purchase.ticket.validUntil,
      })
    }

    // Create validation record
    const validation = await prisma.ticketValidation.create({
      data: {
        ticketId: purchase.ticketId,
        purchaseId: purchase.id,
        validatorMembershipId: membership.id,
        ticketCode,
        attendeeName: purchase.customerName,
        attendeeEmail: purchase.customerEmail,
        validatedAt: new Date(),
        isValid: true,
      },
    })

    // Update purchase used count
    const newUsedCount = purchase.usedCount + 1
    await prisma.ticketPurchase.update({
      where: { id: purchase.id },
      data: {
        usedCount: newUsedCount,
        fullyUsed: newUsedCount >= purchase.quantity,
      },
    })

    return NextResponse.json({
      valid: true,
      message: "Ticket validated successfully",
      ticket: {
        name: purchase.ticket.name,
        event: purchase.ticket.event?.title,
        attendee: purchase.customerName,
      },
      validation,
    })
  } catch (error) {
    console.error("Error validating ticket:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}