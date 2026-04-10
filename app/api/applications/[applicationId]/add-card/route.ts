// app/api/applications/[applicationId]/add-card/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

export async function POST(
  req: NextRequest,
  { params }: { params: { applicationId: string } }
) {
  try {
    const { token } = await req.json()

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

    // Verify token if provided
    if (token) {
      if (application.reviewToken !== token) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 403 })
      }
      
      if (application.reviewTokenExpiresAt && new Date() > application.reviewTokenExpiresAt) {
        return NextResponse.json({ error: 'Token expired' }, { status: 403 })
      }
    }

    if (application.status !== 'REVIEWING') {
      return NextResponse.json({ error: 'Application not ready for card collection' }, { status: 400 })
    }

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

    // Create SetupIntent for saving payment method
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session', // Important: Allows charging later without customer present
      metadata: {
        applicationId: application.id,
        organizationId: application.organizationId,
        houseId: application.houseId,
      }
    })

    return NextResponse.json({
      application: {
        id: application.id,
        firstName: application.firstName,
        lastName: application.lastName,
        email: application.email,
        status: application.status,
        house: application.house,
        membershipPlan: application.membershipPlan,
      },
      clientSecret: setupIntent.client_secret,
    })
  } catch (error) {
    console.error('Add card error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}