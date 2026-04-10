// app/api/applications/[applicationId]/card-added/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

export async function POST(
  req: NextRequest,
  { params }: { params: { applicationId: string } }
) {
  try {
    const { setupIntentId, saveForFuture } = await req.json()

    const application = await prisma.membershipApplication.findUnique({
      where: { id: params.applicationId }
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Retrieve the SetupIntent to get the payment method
    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId)
    
    if (setupIntent.payment_method) {
      // Set this payment method as the default for the customer
      await stripe.customers.update(application.stripeCustomerId!, {
        invoice_settings: {
          default_payment_method: setupIntent.payment_method as string,
        }
      })
      
      // Store the payment method ID on the application
      await prisma.membershipApplication.update({
        where: { id: application.id },
        data: {
          stripePaymentMethodId: setupIntent.payment_method as string,
        }
      })
    }

    // Update application status
    await prisma.membershipApplication.update({
      where: { id: application.id },
      data: {
        status: 'AWAITING_PAYMENT',
        stripeSetupIntentId: setupIntentId,
        paymentAuthorizedAt: new Date(),
        reviewToken: null,
        reviewTokenUsedAt: new Date(),
      }
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userEmail: application.email,
        action: 'PAYMENT_METHOD_ADDED',
        entityType: 'MEMBERSHIP_APPLICATION',
        entityId: application.id,
        organizationId: application.organizationId,
        houseId: application.houseId,
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Card added error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}