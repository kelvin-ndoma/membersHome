// app/api/applications/[applicationId]/process-payment/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'
import { sendEmail } from '@/lib/email/send'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(
  req: NextRequest,
  { params }: { params: { applicationId: string } }
) {
  try {
    const application = await prisma.membershipApplication.findUnique({
      where: { id: params.applicationId },
      include: {
        membershipPlan: true,
        selectedPrice: true,
        house: {
          include: {
            organization: true,
          }
        }
      }
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    if (application.status !== 'AWAITING_PAYMENT') {
      return NextResponse.json({ error: 'Application not ready for payment' }, { status:400 })
    }

    // Calculate final amount
    const amount = application.finalAmount || application.selectedAmount || 0

    // Create or get Stripe customer
    let customerId = application.stripeCustomerId
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: application.email,
        name: `${application.firstName} ${application.lastName}`,
        metadata: {
          applicationId: application.id,
          organizationId: application.organizationId,
          houseId: application.houseId,
        }
      })
      customerId = customer.id
      
      await prisma.membershipApplication.update({
        where: { id: application.id },
        data: { stripeCustomerId: customerId }
      })
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: application.currency || 'usd',
      customer: customerId,
      setup_future_usage: 'off_session', // Save for recurring billing
      metadata: {
        applicationId: application.id,
        organizationId: application.organizationId,
        houseId: application.houseId,
      }
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    })
  } catch (error) {
    console.error('Process payment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}