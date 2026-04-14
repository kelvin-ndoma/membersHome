// app/api/portal/[houseSlug]/tickets/purchase/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import crypto from 'crypto'

export async function POST(
  req: NextRequest,
  { params }: { params: { houseSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { 
      ticketId, 
      quantity, 
      paymentMethodId, 
      setupForNewCard,
      saveNewCard 
    } = body
    
    const { houseSlug } = params

    if (!ticketId || !quantity) {
      return NextResponse.json({ error: 'Ticket ID and quantity are required' }, { status: 400 })
    }

    // Find house through user's memberships
    const userMemberships = await prisma.membership.findMany({
      where: {
        userId: session.user.id,
        status: 'ACTIVE'
      },
      include: {
        houseMemberships: {
          where: {
            status: 'ACTIVE',
            house: { slug: houseSlug }
          },
          include: { house: true }
        }
      }
    })

    let targetHouse = null
    let memberAccess = null

    for (const membership of userMemberships) {
      const hm = membership.houseMemberships[0]
      if (hm) {
        targetHouse = hm.house
        memberAccess = hm
        break
      }
    }

    if (!targetHouse) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

    // Find the ticket
    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        OR: [
          { houseId: targetHouse.id },
          { organizationId: targetHouse.organizationId, houseId: null }
        ],
        status: 'ACTIVE'
      },
      include: {
        event: true
      }
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Check if member-only ticket
    if (ticket.memberOnly && !memberAccess) {
      return NextResponse.json({ error: 'This ticket is for members only' }, { status: 403 })
    }

    // Check availability
    if (ticket.soldQuantity + quantity > ticket.totalQuantity) {
      return NextResponse.json({ error: 'Not enough tickets available' }, { status: 400 })
    }

    // Check max per purchase
    if (ticket.maxPerPurchase && quantity > ticket.maxPerPurchase) {
      return NextResponse.json({ error: `Maximum ${ticket.maxPerPurchase} tickets per purchase` }, { status: 400 })
    }

    const totalAmount = ticket.price * quantity
    const isFree = totalAmount === 0

    // Get or create Stripe customer
    let customer = await prisma.customer.findUnique({
      where: { userId: session.user.id }
    })

    if (!customer?.stripeCustomerId) {
      const stripeCustomer = await stripe.customers.create({
        email: session.user.email!,
        name: session.user.name || undefined,
        metadata: {
          userId: session.user.id
        }
      })
      
      customer = await prisma.customer.upsert({
        where: { userId: session.user.id },
        update: { stripeCustomerId: stripeCustomer.id },
        create: {
          userId: session.user.id,
          stripeCustomerId: stripeCustomer.id
        }
      })
    }

    // If setting up for new card (not charging yet)
    if (setupForNewCard && !isFree) {
      const setupIntent = await stripe.setupIntents.create({
        customer: customer.stripeCustomerId,
        payment_method_types: ['card'],
        usage: 'off_session',
        metadata: {
          ticketId: ticket.id,
          quantity: quantity.toString(),
          houseSlug,
        }
      })
      
      return NextResponse.json({
        clientSecret: setupIntent.client_secret,
      })
    }

    // Generate ticket codes
    const ticketCodes = Array.from({ length: quantity }, () => 
      crypto.randomBytes(6).toString('hex').toUpperCase()
    )

    // Create purchase record
    const purchase = await prisma.ticketPurchase.create({
      data: {
        ticketId: ticket.id,
        organizationId: ticket.organizationId,
        houseId: ticket.houseId,
        houseMembershipId: memberAccess?.id,
        userId: session.user.id,
        quantity,
        unitPrice: ticket.price,
        totalAmount,
        currency: ticket.currency,
        customerName: session.user.name || undefined,
        customerEmail: session.user.email || undefined,
        ticketCodes,
        paymentStatus: isFree ? 'SUCCEEDED' : 'PENDING',
        paidAt: isFree ? new Date() : undefined,
      }
    })

    // Update ticket sold quantity
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        soldQuantity: { increment: quantity },
        status: ticket.soldQuantity + quantity >= ticket.totalQuantity ? 'SOLD_OUT' : undefined
      }
    })

    // For free tickets, we're done
    if (isFree) {
      // Record zero-amount payment for tracking
      await prisma.payment.create({
        data: {
          amount: 0,
          currency: ticket.currency,
          stripePaymentId: `free-${purchase.id}`,
          status: 'SUCCEEDED',
          paidAt: new Date(),
          organizationId: ticket.organizationId,
          houseId: ticket.houseId,
          userId: session.user.id,
          ticketPurchaseId: purchase.id,
          description: `Free ticket: ${ticket.name} x${quantity}`,
        }
      })

      return NextResponse.json({
        success: true,
        purchase,
        isFree: true,
      })
    }

    // For paid tickets, process payment
    if (!paymentMethodId) {
      // If no payment method but not setup mode, return error
      return NextResponse.json({ error: 'Payment method required' }, { status: 400 })
    }

    try {
      // Create PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalAmount * 100),
        currency: ticket.currency,
        customer: customer.stripeCustomerId,
        payment_method: paymentMethodId,
        confirm: true,
        off_session: true,
        metadata: {
          purchaseId: purchase.id,
          ticketId: ticket.id,
          houseId: targetHouse.id,
          organizationId: ticket.organizationId,
        },
        description: `${ticket.name} x${quantity} - ${ticket.event?.title || 'Event'}`,
      })

      if (paymentIntent.status === 'succeeded') {
        // Update purchase
        await prisma.ticketPurchase.update({
          where: { id: purchase.id },
          data: {
            paymentStatus: 'SUCCEEDED',
            paidAt: new Date()
          }
        })

        // Record payment
        await prisma.payment.create({
          data: {
            amount: totalAmount,
            currency: ticket.currency,
            stripePaymentId: paymentIntent.id,
            status: 'SUCCEEDED',
            paidAt: new Date(),
            organizationId: ticket.organizationId,
            houseId: ticket.houseId,
            userId: session.user.id,
            ticketPurchaseId: purchase.id,
            description: `${ticket.name} x${quantity}`,
          }
        })

        // If user wants to save this card for future
        if (saveNewCard && paymentMethodId) {
          try {
            // Attach payment method to customer if not already
            const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)
            if (paymentMethod.customer !== customer.stripeCustomerId) {
              await stripe.paymentMethods.attach(paymentMethodId, {
                customer: customer.stripeCustomerId,
              })
            }
            
            // Set as default
            await stripe.customers.update(customer.stripeCustomerId, {
              invoice_settings: {
                default_payment_method: paymentMethodId,
              },
            })
          } catch (attachError) {
            console.error('Failed to save card:', attachError)
            // Don't fail the purchase if saving fails
          }
        }

        return NextResponse.json({
          success: true,
          purchase,
        })
      } else if (paymentIntent.status === 'requires_action') {
        // 3D Secure required
        return NextResponse.json({
          requiresAction: true,
          clientSecret: paymentIntent.client_secret,
          purchase,
        })
      } else {
        // Payment failed or pending
        return NextResponse.json({
          success: false,
          status: paymentIntent.status,
          purchase,
        })
      }
    } catch (stripeError: any) {
      console.error('Stripe payment error:', stripeError)
      
      // Update purchase as failed
      await prisma.ticketPurchase.update({
        where: { id: purchase.id },
        data: {
          paymentStatus: 'FAILED',
        }
      })
      
      // Revert ticket quantity
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          soldQuantity: { decrement: quantity },
          status: 'ACTIVE'
        }
      })

      return NextResponse.json({
        error: stripeError.message || 'Payment failed',
        code: stripeError.code,
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Purchase error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}