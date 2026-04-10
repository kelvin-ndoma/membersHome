// app/api/org/[orgSlug]/houses/[houseSlug]/applications/[applicationId]/process-payment/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string; applicationId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { paymentMethodId } = await req.json()

    const application = await prisma.membershipApplication.findFirst({
      where: {
        id: params.applicationId,
        house: {
          slug: params.houseSlug,
          organization: { slug: params.orgSlug }
        }
      },
      include: {
        selectedPrice: true,
        house: {
          include: { organization: true }
        }
      }
    })

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    if (application.status !== 'AWAITING_PAYMENT') {
      return NextResponse.json(
        { error: 'Application is not awaiting payment' },
        { status: 400 }
      )
    }

    const amount = application.finalAmount || application.selectedAmount || 0

    // Create or get Stripe customer
    let stripeCustomerId = application.stripeCustomerId
    
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: application.email,
        name: `${application.firstName} ${application.lastName}`,
        metadata: {
          applicationId: application.id,
          organizationId: application.organizationId
        }
      })
      stripeCustomerId = customer.id
      
      await prisma.membershipApplication.update({
        where: { id: application.id },
        data: { stripeCustomerId }
      })
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: application.currency || 'usd',
      customer: stripeCustomerId,
      payment_method: paymentMethodId,
      confirm: true,
      metadata: {
        applicationId: application.id,
        organizationId: application.organizationId,
        houseId: application.houseId
      }
    })

    if (paymentIntent.status === 'succeeded') {
      // Record payment
      await prisma.payment.create({
        data: {
          amount,
          currency: application.currency || 'USD',
          stripePaymentId: paymentIntent.id,
          status: 'SUCCEEDED',
          paidAt: new Date(),
          organizationId: application.organizationId,
          houseId: application.houseId,
          userId: session.user.id,
          membershipApplicationId: application.id,
          description: `Membership application fee - ${application.house.organization.name}`
        }
      })

      // Update application
      await prisma.membershipApplication.update({
        where: { id: application.id },
        data: {
          status: 'APPROVED',
          paymentProcessedAt: new Date(),
          stripePaymentIntentId: paymentIntent.id,
          approvedAt: new Date(),
          reviewedBy: session.user.id,
          reviewedAt: new Date()
        }
      })

      // Create membership
      const user = await prisma.user.findUnique({
        where: { email: application.email }
      })

      if (user) {
        let membership = await prisma.membership.findFirst({
          where: {
            userId: user.id,
            organizationId: application.organizationId
          }
        })

        if (!membership) {
          membership = await prisma.membership.create({
            data: {
              userId: user.id,
              organizationId: application.organizationId,
              role: 'MEMBER',
              status: 'ACTIVE'
            }
          })
        }

        // Create house membership
        await prisma.houseMembership.create({
          data: {
            houseId: application.houseId,
            membershipId: membership.id,
            role: 'HOUSE_MEMBER',
            status: 'ACTIVE',
            membershipNumber: application.membershipNumber || undefined
          }
        })

        // Create membership item for tracking
        if (application.selectedPlanId && application.selectedPriceId) {
          await prisma.membershipItem.create({
            data: {
              organizationId: application.organizationId,
              houseId: application.houseId,
              houseMembershipId: membership.id,
              membershipPlanId: application.selectedPlanId,
              planPriceId: application.selectedPriceId,
              userId: user.id,
              applicationId: application.id,
              status: 'ACTIVE',
              billingFrequency: application.selectedFrequency!,
              amount: application.selectedAmount!,
              currency: application.currency || 'USD',
              startDate: new Date()
            }
          })
        }
      }

      return NextResponse.json({
        success: true,
        status: 'succeeded',
        paymentIntent
      })
    } else {
      // Payment requires additional action
      return NextResponse.json({
        success: false,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret
      })
    }
  } catch (error) {
    console.error('Process payment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}