// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email/send'
import { headers } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const headersList = headers()
    const signature = headersList.get('stripe-signature')!

    let event

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
    } catch (error: any) {
      console.error('Webhook signature verification failed:', error.message)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object)
        break
      
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object)
        break
      
      case 'setup_intent.succeeded':
        await handleSetupIntentSucceeded(event.data.object)
        break
      
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object)
        break
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object)
        break
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object)
        break
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object)
        break
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object)
        break
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: any) {
  const { applicationId, organizationId, houseId } = paymentIntent.metadata || {}
  
  if (applicationId) {
    console.log('Payment succeeded for application:', applicationId)
  }
}

async function handlePaymentIntentFailed(paymentIntent: any) {
  const { applicationId } = paymentIntent.metadata || {}
  
  if (applicationId) {
    const application = await prisma.membershipApplication.findUnique({
      where: { id: applicationId },
      include: {
        house: {
          include: { organization: true }
        }
      }
    })
    
    if (application) {
      const retryUrl = `${process.env.NEXT_PUBLIC_APP_URL}/applications/${applicationId}/add-card`
      
      await sendEmail({
        to: application.email,
        template: 'payment-failed',
        data: {
          name: application.firstName,
          organizationName: application.house?.organization.name,
          houseName: application.house?.name,
          amount: `${paymentIntent.currency} ${(paymentIntent.amount / 100).toFixed(2)}`,
          retryUrl,
          failureReason: paymentIntent.last_payment_error?.message || 'Payment declined',
        }
      })
    }
  }
}

async function handleSetupIntentSucceeded(setupIntent: any) {
  const { applicationId } = setupIntent.metadata || {}
  
  if (applicationId) {
    console.log('Setup intent succeeded for application:', applicationId)
  }
}

async function handleSubscriptionCreated(subscription: any) {
  const { membershipItemId } = subscription.metadata || {}
  
  if (membershipItemId) {
    await prisma.membershipItem.update({
      where: { id: membershipItemId },
      data: {
        stripeSubscriptionId: subscription.id,
        paymentStatus: 'PENDING',
      }
    })
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  const { membershipItemId } = subscription.metadata || {}
  
  if (membershipItemId) {
    const status = subscription.status === 'active' ? 'ACTIVE' : 
                   subscription.status === 'past_due' ? 'PAUSED' : 'ACTIVE'
    
    await prisma.membershipItem.update({
      where: { id: membershipItemId },
      data: {
        status,
        nextBillingDate: new Date(subscription.current_period_end * 1000),
      }
    })
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  const { membershipItemId } = subscription.metadata || {}
  
  if (membershipItemId) {
    await prisma.membershipItem.update({
      where: { id: membershipItemId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      }
    })
  }
}

async function handleInvoicePaymentSucceeded(invoice: any) {
  const { membershipItemId } = invoice.metadata || {}
  
  if (membershipItemId) {
    // Get the membership item with all needed relations
    const membershipItem = await prisma.membershipItem.findUnique({
      where: { id: membershipItemId },
      include: {
        user: true,
        organization: true,
        house: true,
        houseMembership: true,
      }
    })
    
    if (membershipItem) {
      // Record the payment with required fields
      await prisma.payment.create({
        data: {
          amount: invoice.amount_paid / 100,
          currency: invoice.currency,
          stripePaymentId: typeof invoice.payment_intent === 'string' 
            ? invoice.payment_intent 
            : invoice.payment_intent?.id || invoice.id,
          status: 'SUCCEEDED',
          paidAt: new Date(),
          organizationId: membershipItem.organizationId,
          houseId: membershipItem.houseId,
          userId: membershipItem.userId,
          membershipItemId,
          houseMembershipId: membershipItem.houseMembershipId,
          metadata: {
            invoiceId: invoice.id,
            invoiceNumber: invoice.number,
          }
        }
      })
      
      // Update membership item
      await prisma.membershipItem.update({
        where: { id: membershipItemId },
        data: {
          paymentStatus: 'SUCCEEDED',
          lastBilledAt: new Date(),
          failedPaymentCount: 0,
        }
      })
    }
  }
}

async function handleInvoicePaymentFailed(invoice: any) {
  const { membershipItemId } = invoice.metadata || {}
  
  if (membershipItemId) {
    const membershipItem = await prisma.membershipItem.findUnique({
      where: { id: membershipItemId },
      include: {
        user: true,
        organization: true,
        house: {
          include: { organization: true }
        }
      }
    })
    
    if (membershipItem) {
      // Increment failed payment count
      const updatedItem = await prisma.membershipItem.update({
        where: { id: membershipItemId },
        data: {
          failedPaymentCount: { increment: 1 },
          paymentStatus: 'FAILED',
        }
      })
      
      // Send email to member
      const updatePaymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/portal/${membershipItem.organization?.slug}/${membershipItem.house?.slug}/billing`
      
      await sendEmail({
        to: membershipItem.user.email,
        template: 'payment-failed',
        data: {
          name: membershipItem.user.name || membershipItem.user.email,
          organizationName: membershipItem.organization?.name,
          houseName: membershipItem.house?.name,
          amount: `${invoice.currency} ${(invoice.amount_due / 100).toFixed(2)}`,
          retryUrl: updatePaymentUrl,
        }
      })
      
      // After 3 failed attempts, pause the membership
      if (updatedItem.failedPaymentCount >= 3) {
        await prisma.membershipItem.update({
          where: { id: membershipItemId },
          data: {
            status: 'PAUSED',
            pausedAt: new Date(),
          }
        })
      }
    }
  }
}