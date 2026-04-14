// app/api/org/[orgSlug]/houses/[houseSlug]/members/[memberId]/cancel/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

export async function POST(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string; memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reason } = await req.json()

    const member = await prisma.houseMembership.findFirst({
      where: {
        id: params.memberId,
        house: {
          slug: params.houseSlug,
          organization: { slug: params.orgSlug }
        }
      },
      include: {
        house: {
          select: { id: true, organizationId: true }
        },
        membershipItems: {
          where: { status: { in: ['ACTIVE', 'PAUSED'] } },
          include: {
            membershipPlan: true
          }
        },
        membership: {
          include: {
            user: {
              include: {
                customer: true
              }
            }
          }
        }
      }
    })

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Cancel Stripe subscriptions
    for (const item of member.membershipItems) {
      if (item.stripeSubscriptionId) {
        await stripe.subscriptions.cancel(item.stripeSubscriptionId)
      }
    }

    // Update membership status - use 'CANCELLED' as string
    await prisma.houseMembership.update({
      where: { id: member.id },
      data: { status: 'CANCELLED' as any }
    })

    // Update membership items
    await prisma.membershipItem.updateMany({
      where: {
        houseMembershipId: member.id,
        status: { in: ['ACTIVE', 'PAUSED'] }
      },
      data: {
        status: 'CANCELLED' as any,
        cancelledAt: new Date(),
        cancellationReason: reason
      }
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email || '',
        action: 'MEMBERSHIP_CANCELLED',
        entityType: 'HOUSE_MEMBERSHIP',
        entityId: member.id,
        organizationId: member.house?.organizationId || '',
        houseId: member.houseId,
        metadata: { reason, cancelledBy: 'admin' }
      }
    })

    return NextResponse.json({ success: true, message: 'Membership cancelled' })
  } catch (error) {
    console.error('Cancel member error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}