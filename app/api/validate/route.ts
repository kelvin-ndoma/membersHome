// app/api/validate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { ticketCode, houseSlug, entryPoint, gateNumber } = await req.json()

    if (!ticketCode) {
      return NextResponse.json({ error: 'Ticket code required' }, { status: 400 })
    }

    // For MongoDB, we need to use the raw query or find all and filter
    // Since ticketCodes is a Json field, we need to query differently
    
    // First, get all purchases and filter in memory (small scale) OR use raw MongoDB query
    const purchases = await prisma.ticketPurchase.findMany({
      where: {
        paymentStatus: 'SUCCEEDED'
      },
      include: {
        ticket: {
          include: {
            event: {
              select: {
                id: true,
                title: true,
                startDate: true,
                endDate: true,
                location: true,
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        validations: {
          orderBy: { validatedAt: 'desc' }
        }
      }
    })

    // Find the purchase that contains this ticket code
    const purchase = purchases.find(p => {
      const codes = p.ticketCodes as string[]
      return codes.includes(ticketCode)
    })

    if (!purchase) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Invalid ticket code' 
      }, { status: 404 })
    }

    // Check if ticket is already fully used
    if (purchase.fullyUsed) {
      return NextResponse.json({
        valid: false,
        error: 'Ticket already fully redeemed',
        purchase: {
          id: purchase.id,
          ticketName: purchase.ticket?.name || 'Unknown Ticket',
          event: purchase.ticket?.event || null,
          customerName: purchase.customerName || purchase.user?.name || 'Unknown',
        }
      })
    }

    // Check if this specific code was already validated
    const existingValidation = purchase.validations?.find(v => v.ticketCode === ticketCode)
    if (existingValidation) {
      return NextResponse.json({
        valid: false,
        error: 'Ticket already scanned',
        validation: {
          validatedAt: existingValidation.validatedAt,
          entryPoint: existingValidation.entryPoint,
          isReentry: existingValidation.isReentry,
        },
        purchase: {
          id: purchase.id,
          ticketName: purchase.ticket?.name || 'Unknown Ticket',
          event: purchase.ticket?.event || null,
          customerName: purchase.customerName || purchase.user?.name || 'Unknown',
        }
      })
    }

    // Check if event is active
    const now = new Date()
    const event = purchase.ticket?.event
    if (event) {
      const eventStart = new Date(event.startDate)
      const eventEnd = event.endDate ? new Date(event.endDate) : null
      
      const validationWindowStart = new Date(eventStart.getTime() - 2 * 60 * 60 * 1000)
      const validationWindowEnd = eventEnd 
        ? new Date(eventEnd.getTime() + 6 * 60 * 60 * 1000)
        : new Date(eventStart.getTime() + 12 * 60 * 60 * 1000)
      
      if (now < validationWindowStart) {
        return NextResponse.json({
          valid: false,
          error: `Ticket valid from ${validationWindowStart.toLocaleString()}`,
          purchase: {
            id: purchase.id,
            ticketName: purchase.ticket?.name || 'Unknown Ticket',
            event: purchase.ticket?.event || null,
          }
        })
      }
      
      if (now > validationWindowEnd) {
        return NextResponse.json({
          valid: false,
          error: 'Ticket expired',
          purchase: {
            id: purchase.id,
            ticketName: purchase.ticket?.name || 'Unknown Ticket',
            event: purchase.ticket?.event || null,
          }
        })
      }
    }

    // Get validator (staff member scanning)
    let validatorHouseMembershipId: string | null = null
    if (houseSlug) {
      const validatorHouse = await prisma.house.findFirst({
        where: { slug: houseSlug },
        include: {
          members: {
            where: {
              membership: { userId: session.user.id },
              status: 'ACTIVE',
              role: { in: ['HOUSE_MANAGER', 'HOUSE_ADMIN', 'HOUSE_STAFF'] }
            }
          }
        }
      })
      
      if (validatorHouse?.members[0]) {
        validatorHouseMembershipId = validatorHouse.members[0].id
      }
    }

    // Create validation record
    const validation = await prisma.ticketValidation.create({
      data: {
        ticketId: purchase.ticketId,
        purchaseId: purchase.id,
        validatorHouseMembershipId,
        ticketCode,
        attendeeName: purchase.customerName || purchase.user?.name || null,
        attendeeEmail: purchase.customerEmail || purchase.user?.email || null,
        validatedAt: new Date(),
        entryPoint: entryPoint || 'Main Entrance',
        gateNumber: gateNumber || null,
        isValid: true,
      }
    })

    // Update purchase used count
    const updatedPurchase = await prisma.ticketPurchase.update({
      where: { id: purchase.id },
      data: {
        usedCount: { increment: 1 },
        fullyUsed: purchase.usedCount + 1 >= purchase.quantity,
      }
    })

    return NextResponse.json({
      valid: true,
      message: 'Ticket validated successfully',
      validation: {
        id: validation.id,
        validatedAt: validation.validatedAt,
        entryPoint: validation.entryPoint,
      },
      purchase: {
        id: purchase.id,
        ticketName: purchase.ticket?.name || 'Unknown Ticket',
        event: purchase.ticket?.event || null,
        customerName: purchase.customerName || purchase.user?.name || 'Unknown',
        usedCount: updatedPurchase.usedCount,
        totalQuantity: purchase.quantity,
        remaining: purchase.quantity - updatedPurchase.usedCount,
      }
    })
  } catch (error) {
    console.error('Validation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Get ticket info by code (for pre-scan display)
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const ticketCode = searchParams.get('code')

    if (!ticketCode) {
      return NextResponse.json({ error: 'Ticket code required' }, { status: 400 })
    }

    const purchases = await prisma.ticketPurchase.findMany({
      where: {
        paymentStatus: 'SUCCEEDED'
      },
      include: {
        ticket: {
          include: {
            event: {
              select: {
                id: true,
                title: true,
                startDate: true,
                location: true,
              }
            }
          }
        },
        user: {
          select: {
            name: true,
            email: true,
          }
        },
        validations: {
          orderBy: { validatedAt: 'desc' }
        }
      }
    })

    const purchase = purchases.find(p => {
      const codes = p.ticketCodes as string[]
      return codes.includes(ticketCode)
    })

    if (!purchase) {
      return NextResponse.json({ error: 'Invalid ticket code' }, { status: 404 })
    }

    const alreadyScanned = purchase.validations?.some(v => v.ticketCode === ticketCode) || false
    const lastValidation = purchase.validations?.find(v => v.ticketCode === ticketCode) || null

    return NextResponse.json({
      valid: !alreadyScanned && !purchase.fullyUsed,
      alreadyScanned,
      fullyUsed: purchase.fullyUsed,
      ticket: {
        name: purchase.ticket?.name || 'Unknown Ticket',
        event: purchase.ticket?.event || null,
      },
      attendee: {
        name: purchase.customerName || purchase.user?.name || 'Unknown',
        email: purchase.customerEmail || purchase.user?.email || '',
      },
      purchase: {
        quantity: purchase.quantity,
        usedCount: purchase.usedCount,
      },
      lastValidation,
    })
  } catch (error) {
    console.error('Get ticket info error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}