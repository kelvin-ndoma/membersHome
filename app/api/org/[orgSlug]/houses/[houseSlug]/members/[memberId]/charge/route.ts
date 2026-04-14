// app/api/org/[orgSlug]/houses/[houseSlug]/members/[memberId]/charge/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

export async function POST(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string; memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { amount, currency, description, paymentMethodId } = await req.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 })
    }

    const member = await prisma.houseMembership.findFirst({
      where: {
        id: params.memberId,
        house: {
          slug: params.houseSlug,
          organization: { slug: params.orgSlug }
        }
      },
      include: {
        house: {
          select: { id: true, organizationId: true, name: true }
        },
        membership: {
          include: {
            user: {
              include: {
                customer: true
              }
            }
          }
        }
      }
    })

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    const organizationId = member.house?.organizationId || ''
    const customerId = member.membership?.user?.customer?.stripeCustomerId

    if (!customerId) {
      return NextResponse.json({ 
        error: 'No payment method on file. Member needs to add a payment method first.' 
      }, { status: 400 })
    }

    // Get customer to check for default payment method
    const customer = await stripe.customers.retrieve(customerId)
    const defaultPaymentMethodId = (customer as any).invoice_settings?.default_payment_method

    // Get all payment methods for this customer
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card'
    })

    if (paymentMethods.data.length === 0) {
      return NextResponse.json({ 
        error: 'No payment method on file. Member needs to add a payment method first.' 
      }, { status: 400 })
    }

    // Determine which payment method to use
    let chargePaymentMethodId = paymentMethodId
    
    if (!chargePaymentMethodId) {
      // Use default if available, otherwise use the first card
      chargePaymentMethodId = defaultPaymentMethodId || paymentMethods.data[0].id
    }

    // Verify the payment method belongs to this customer
    const isValidPaymentMethod = paymentMethods.data.some(pm => pm.id === chargePaymentMethodId)
    if (!isValidPaymentMethod) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
    }

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-${Date.now()}`,
        organizationId: organizationId,
        houseMembershipId: member.id,
        amount: amount,
        currency: currency || 'USD',
        description: description || `Manual charge - ${member.house?.name || 'Membership'}`,
        status: 'PENDING' as any,
        createdBy: session.user.id
      }
    })

    // Create payment intent with the selected payment method
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: (currency || 'usd').toLowerCase(),
      customer: customerId,
      payment_method: chargePaymentMethodId,
      off_session: true,
      confirm: true,
      metadata: {
        memberId: member.id,
        invoiceId: invoice.id,
        houseId: member.houseId,
        organizationId: organizationId,
        chargedBy: session.user.id
      }
    })

    if (paymentIntent.status === 'succeeded') {
      // Record successful payment
      await prisma.$transaction([
        prisma.payment.create({
          data: {
            amount: amount,
            currency: currency || 'USD',
            stripePaymentId: paymentIntent.id,
            status: 'SUCCEEDED' as any,
            paidAt: new Date(),
            organizationId: organizationId,
            houseId: member.houseId,
            houseMembershipId: member.id,
            userId: session.user.id,
            description: description || 'Manual charge'
          }
        }),
        prisma.invoice.update({
          where: { id: invoice.id },
          data: { 
            status: 'PAID' as any, 
            paidAt: new Date(),
            paidBy: session.user.id
          }
        })
      ])

      // Log the action
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          userEmail: session.user.email || '',
          action: 'MEMBER_CHARGED',
          entityType: 'HOUSE_MEMBERSHIP',
          entityId: member.id,
          organizationId: organizationId,
          houseId: member.houseId,
          metadata: { 
            amount, 
            currency, 
            description, 
            paymentMethodId: chargePaymentMethodId,
            invoiceId: invoice.id 
          }
        }
      })

      return NextResponse.json({ 
        success: true, 
        message: 'Payment successful',
        paymentIntent,
        invoice
      })
    } else if (paymentIntent.status === 'requires_action') {
      // 3D Secure required - return client secret for frontend to handle
      return NextResponse.json({
        success: false,
        requiresAction: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        message: 'Payment requires additional authentication'
      })
    } else {
      // Payment failed
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: 'FAILED' as any }
      })

      return NextResponse.json({
        success: false,
        error: `Payment failed: ${paymentIntent.status}`,
        paymentIntent
      })
    }
  } catch (error: any) {
    console.error('Charge member error:', error)
    
    // Handle specific Stripe errors
    if (error.type === 'StripeCardError') {
      return NextResponse.json({
        error: error.message || 'Card was declined'
      }, { status: 400 })
    }
    
    if (error.code === 'authentication_required') {
      return NextResponse.json({
        requiresAction: true,
        clientSecret: error.raw?.payment_intent?.client_secret,
        error: 'Authentication required'
      }, { status: 400 })
    }
    
    return NextResponse.json({
      error: error.message || 'Payment failed'
    }, { status: 500 })
  }
}