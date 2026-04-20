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
      
      case 'transfer.created':
        await handleTransferCreated(event.data.object)
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
  const { applicationId, organizationId, houseId, productId, buyerId, purchaseId } = paymentIntent.metadata || {}
  
  // Handle membership application payment
  if (applicationId) {
    console.log('Payment succeeded for application:', applicationId)
    
    await prisma.membershipApplication.update({
      where: { id: applicationId },
      data: {
        status: 'APPROVED',
        paymentProcessedAt: new Date(),
        stripePaymentIntentId: paymentIntent.id
      }
    })
  }
  
  // Handle marketplace purchase
  if (productId && buyerId) {
    console.log('Marketplace purchase succeeded for product:', productId)
    
    // Find the pending purchase
    const purchase = await prisma.communityPurchase.findFirst({
      where: {
        productId: productId,
        buyerId: buyerId,
        status: 'PENDING'
      },
      include: {
        product: {
          include: {
            seller: true
          }
        },
        buyer: true
      }
    })
    
    if (purchase) {
      // Update purchase status to COMPLETED
      await prisma.communityPurchase.update({
        where: { id: purchase.id },
        data: { 
          status: 'COMPLETED',
          paymentId: paymentIntent.id
        }
      })
      
      // Update product inventory
      if (purchase.product.inventory !== null) {
        await prisma.communityProduct.update({
          where: { id: purchase.productId },
          data: {
            inventory: { decrement: purchase.quantity },
            salesCount: { increment: purchase.quantity },
            revenue: { increment: purchase.totalAmount }
          }
        })
      } else {
        await prisma.communityProduct.update({
          where: { id: purchase.productId },
          data: {
            salesCount: { increment: purchase.quantity },
            revenue: { increment: purchase.totalAmount }
          }
        })
      }
      
      // Create transfer to seller
      if (purchase.sellerPayoutAmount && purchase.product.seller.stripeConnectAccountId) {
        try {
          const transfer = await stripe.transfers.create({
            amount: Math.round(purchase.sellerPayoutAmount * 100),
            currency: purchase.currency.toLowerCase(),
            destination: purchase.product.seller.stripeConnectAccountId,
            transfer_group: paymentIntent.id,
            metadata: {
              purchaseId: purchase.id,
              productId: purchase.productId,
              productName: purchase.product.name,
              houseFeePercent: purchase.houseFeePercent?.toString() || '5'
            }
          })
          
          await prisma.communityPurchase.update({
            where: { id: purchase.id },
            data: { sellerPaidAt: new Date() }
          })
          
          console.log(`Transfer sent to seller ${purchase.product.seller.id}: ${transfer.id}`)
        } catch (transferError) {
          console.error('Failed to create transfer to seller:', transferError)
        }
      }
      
      // Mark house as paid
      await prisma.communityPurchase.update({
        where: { id: purchase.id },
        data: { housePaidAt: new Date() }
      })
      
      // Send purchase confirmation email
      await sendEmail({
        to: purchase.buyer.email,
        template: 'payment-success',
        data: {
          name: purchase.buyer.name,
          productName: purchase.product.name,
          quantity: purchase.quantity,
          totalAmount: purchase.totalAmount,
          isDigital: purchase.product.isDigital,
          downloadToken: purchase.downloadToken
        }
      })
    }
  }
}

async function handlePaymentIntentFailed(paymentIntent: any) {
  const { applicationId, productId, buyerId } = paymentIntent.metadata || {}
  
  // Handle failed membership application payment
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
  
  // Handle failed marketplace purchase
  if (productId && buyerId) {
    const purchase = await prisma.communityPurchase.findFirst({
      where: {
        productId: productId,
        buyerId: buyerId,
        status: 'PENDING'
      },
      include: {
        product: {
          include: {
            seller: true
          }
        },
        buyer: true
      }
    })
    
    if (purchase) {
      // Update purchase status to CANCELLED
      await prisma.communityPurchase.update({
        where: { id: purchase.id },
        data: { status: 'CANCELLED' }
      })
      
      // Send failure email to buyer
      await sendEmail({
        to: purchase.buyer.email,
        template: 'payment-failed',
        data: {
          name: purchase.buyer.name,
          productName: purchase.product.name,
          amount: `${paymentIntent.currency} ${(paymentIntent.amount / 100).toFixed(2)}`,
          failureReason: paymentIntent.last_payment_error?.message || 'Payment declined'
        }
      })
    }
  }
}

async function handleSetupIntentSucceeded(setupIntent: any) {
  const { applicationId } = setupIntent.metadata || {}
  
  if (applicationId) {
    console.log('Setup intent succeeded for application:', applicationId)
    
    await prisma.membershipApplication.update({
      where: { id: applicationId },
      data: {
        stripePaymentMethodId: setupIntent.payment_method,
        paymentAuthorizedAt: new Date()
      }
    })
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

async function handleTransferCreated(transfer: any) {
  console.log(`Transfer created: ${transfer.id} for amount ${transfer.amount / 100} ${transfer.currency}`)
  
  // Find the purchase by metadata
  const purchaseId = transfer.metadata?.purchaseId
  if (purchaseId) {
    await prisma.communityPurchase.update({
      where: { id: purchaseId },
      data: { sellerPaidAt: new Date() }
    })
  }
}