// app/api/applications/[applicationId]/charge/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email/send'
import { stripe } from '@/lib/stripe'

export async function POST(
  req: NextRequest,
  { params }: { params: { applicationId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { amount, currency, initiationFee, prorated, proratedAmount } = await req.json()

    const application = await prisma.membershipApplication.findUnique({
      where: { id: params.applicationId },
      include: {
        house: {
          include: {
            organization: true,
          }
        },
        membershipPlan: true,
        selectedPrice: true,
      }
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    if (application.status !== 'AWAITING_PAYMENT') {
      return NextResponse.json({ error: 'Application not ready for payment' }, { status: 400 })
    }

    if (!application.stripeCustomerId) {
      return NextResponse.json({ error: 'No customer found' }, { status: 400 })
    }

    const totalAmount = (amount || 0) + (initiationFee || 0)

    try {
      // Get customer with default payment method
      const customer = await stripe.customers.retrieve(application.stripeCustomerId)
      
      const defaultPaymentMethod = (customer as any).invoice_settings?.default_payment_method
      
      if (!defaultPaymentMethod && !application.stripePaymentMethodId) {
        return NextResponse.json({ 
          error: 'No payment method found. Please collect a card first.' 
        }, { status: 400 })
      }

      const paymentMethodId = defaultPaymentMethod || application.stripePaymentMethodId

      // Create PaymentIntent with the saved payment method
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalAmount * 100),
        currency: currency || 'usd',
        customer: application.stripeCustomerId,
        payment_method: paymentMethodId as string,
        off_session: true,
        confirm: true,
        metadata: {
          applicationId: application.id,
          organizationId: application.organizationId,
          houseId: application.houseId,
        }
      })

      if (paymentIntent.status === 'succeeded') {
        // Record payment
        await prisma.payment.create({
          data: {
            amount: totalAmount,
            currency: currency || 'USD',
            stripePaymentId: paymentIntent.id,
            status: 'SUCCEEDED',
            paidAt: new Date(),
            organizationId: application.organizationId,
            houseId: application.houseId,
            membershipApplicationId: application.id,
            userId: session.user.id,
          }
        })

        // Generate membership number
        const membershipNumber = `M${new Date().getFullYear()}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`

        // Update application
        await prisma.membershipApplication.update({
          where: { id: application.id },
          data: {
            status: 'APPROVED',
            approvedAt: new Date(),
            paymentProcessedAt: new Date(),
            stripePaymentIntentId: paymentIntent.id,
            membershipNumber,
            finalAmount: totalAmount,
            proratedAmount: prorated ? proratedAmount : null,
          }
        })

        return NextResponse.json({
          success: true,
          membershipNumber,
          paymentId: paymentIntent.id,
        })
      } else {
        return NextResponse.json({
          success: false,
          requiresAction: true,
          clientSecret: paymentIntent.client_secret,
        })
      }
    } catch (stripeError: any) {
      console.error('Stripe payment error:', stripeError)

      // Send payment failed email
      const retryUrl = `${process.env.NEXT_PUBLIC_APP_URL}/applications/${application.id}/add-card`
      
      await sendEmail({
        to: application.email,
        template: 'payment-failed',
        data: {
          name: application.firstName,
          organizationName: application.house.organization.name,
          houseName: application.house.name,
          amount: `${currency} ${totalAmount}`,
          retryUrl,
          failureReason: stripeError.message,
        }
      })

      return NextResponse.json({
        success: false,
        error: stripeError.message,
      })
    }
  } catch (error) {
    console.error('Charge error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}