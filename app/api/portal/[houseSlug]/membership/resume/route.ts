// app/api/portal/[houseSlug]/membership/resume/route.ts
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
          where: { status: 'PAUSED' }
        }
      }
    })

    if (!memberAccess) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 })
    }

    const membershipItem = memberAccess.membershipItems[0]

    if (!membershipItem) {
      return NextResponse.json({ error: 'No paused membership found' }, { status: 400 })
    }

    if (membershipItem.stripeSubscriptionId) {
      // Resume the Stripe subscription
      await stripe.subscriptions.update(membershipItem.stripeSubscriptionId, {
        pause_collection: null
      })
    }

    // Update membership item
    await prisma.membershipItem.update({
      where: { id: membershipItem.id },
      data: {
        status: 'ACTIVE',
        resumedAt: new Date()
      }
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email || '',
        action: 'MEMBERSHIP_RESUMED',
        entityType: 'HOUSE_MEMBERSHIP',
        entityId: memberAccess.id,
        organizationId: house.organizationId,
        houseId: house.id
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Membership resumed successfully'
    })
  } catch (error) {
    console.error('Resume membership error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}