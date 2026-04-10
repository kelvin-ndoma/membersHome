// app/api/apply/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email/send'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      gender,
      company,
      position,
      howDidYouHear,
      contribution,
      hobbies,
      membershipPlanId,
      selectedPriceId,
      orgSlug,
      houseSlug,
    } = await req.json()

    if (!firstName || !lastName || !email || !membershipPlanId || !selectedPriceId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Find the house and plan
    const house = await prisma.house.findFirst({
      where: {
        slug: houseSlug,
        organization: { slug: orgSlug },
        isPrivate: false,
      },
      include: {
        organization: true,
      }
    })

    if (!house) {
      return NextResponse.json(
        { error: 'House not found' },
        { status: 404 }
      )
    }

    // Verify the plan belongs to this house
    const plan = await prisma.membershipPlan.findFirst({
      where: {
        id: membershipPlanId,
        OR: [
          { houseId: house.id },
          { organizationId: house.organizationId, houseId: null }
        ]
      },
      include: {
        prices: {
          where: { id: selectedPriceId }
        }
      }
    })

    if (!plan || plan.prices.length === 0) {
      return NextResponse.json(
        { error: 'Invalid plan or price selected' },
        { status: 400 }
      )
    }

    const selectedPrice = plan.prices[0]

    // Generate a unique token for application tracking
    const reviewToken = crypto.randomBytes(32).toString('hex')

    // Create the application
    const application = await prisma.membershipApplication.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        gender,
        company,
        position,
        howDidYouHear,
        contribution,
        hobbies,
        membershipPlanId,
        selectedPriceId,
        selectedAmount: selectedPrice.amount,
        selectedFrequency: selectedPrice.billingFrequency,
        currency: selectedPrice.currency,
        status: 'PENDING',
        reviewToken,
        reviewTokenSentAt: new Date(),
        reviewTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        organizationId: house.organizationId,
        houseId: house.id,
      }
    })

    // Send confirmation email to applicant
    const statusUrl = `${process.env.NEXT_PUBLIC_APP_URL}/apply/status/${application.id}`
    
    await sendEmail({
      to: email,
      template: 'application-received',
      data: {
        name: firstName,
        organizationName: house.organization.name,
        houseName: house.name,
        planName: plan.name,
        statusUrl,
      }
    })

    // Log the application
    await prisma.auditLog.create({
      data: {
        userEmail: email,
        action: 'APPLICATION_SUBMITTED',
        entityType: 'MEMBERSHIP_APPLICATION',
        entityId: application.id,
        organizationId: house.organizationId,
        houseId: house.id,
        metadata: {
          firstName,
          lastName,
          planName: plan.name,
        }
      }
    })

    return NextResponse.json({
      success: true,
      applicationId: application.id,
      message: 'Application submitted successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Submit application error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}