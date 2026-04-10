// app/api/org/[orgSlug]/houses/[houseSlug]/applications/[applicationId]/retry-payment/route.ts
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

    const application = await prisma.membershipApplication.findFirst({
      where: {
        id: params.applicationId,
        house: {
          slug: params.houseSlug,
          organization: { slug: params.orgSlug }
        }
      }
    })

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    // Reset payment status
    await prisma.membershipApplication.update({
      where: { id: application.id },
      data: {
        status: 'AWAITING_PAYMENT',
        paymentFailedAt: null,
        paymentFailureMessage: null
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Application ready for payment retry'
    })
  } catch (error) {
    console.error('Retry payment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}