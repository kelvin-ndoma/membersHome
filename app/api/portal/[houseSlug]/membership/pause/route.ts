// app/api/portal/[houseSlug]/membership/pause/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

export async function POST(
  req: NextRequest,
  { params }: { params: { houseSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reason, pauseUntil } = await req.json()

    const house = await prisma.house.findFirst({
      where: { slug: params.houseSlug }
    })

    if (!house) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

    const memberAccess = await prisma.houseMembership.findFirst({
      where: {
        houseId: house.id,
        membership: { userId: session.user.id },
        status: 'ACTIVE'
      },
      include: {
        membershipItems: {
          where: { status: 'ACTIVE' }
        }
      }
    })

    if (!memberAccess) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 })
    }

    const membershipItem = memberAccess.membershipItems[0]

    if (membershipItem?.stripeSubscriptionId) {
      // Pause the Stripe subscription
      await stripe.subscriptions.update(membershipItem.stripeSubscriptionId, {
        pause_collection: {
          behavior: 'void',
          resumes_at: pauseUntil ? Math.floor(new Date(pauseUntil).getTime() / 1000) : undefined
        }
      })
    }

    // Update membership item
    if (membershipItem) {
      await prisma.membershipItem.update({
        where: { id: membershipItem.id },
        data: {
          status: 'PAUSED',
          pausedAt: new Date()
        }
      })
    }

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email || '',
        action: 'MEMBERSHIP_PAUSED',
        entityType: 'HOUSE_MEMBERSHIP',
        entityId: memberAccess.id,
        organizationId: house.organizationId,
        houseId: house.id,
        metadata: { reason, pauseUntil }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Membership paused successfully'
    })
  } catch (error) {
    console.error('Pause membership error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}