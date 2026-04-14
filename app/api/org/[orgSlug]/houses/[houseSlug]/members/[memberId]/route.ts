// app/api/org/[orgSlug]/houses/[houseSlug]/members/[memberId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string; memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
          select: { id: true, organizationId: true, name: true }
        },
        membership: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                phone: true,
                emailVerified: true,
                lastLoginAt: true,
                createdAt: true,
              }
            },
            organization: {
              select: { id: true, name: true, slug: true }
            }
          }
        },
        memberProfile: true,
        memberDashboard: true,
        membershipItems: {
          include: {
            membershipPlan: true,
            planPrice: true
          },
          orderBy: { createdAt: 'desc' }
        },
        payments: {
          orderBy: { createdAt: 'desc' }
        },
        invoices: {
          orderBy: { createdAt: 'desc' }
        },
        cancellationRequests: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    const organizationId = member.house?.organizationId || ''

    // Get communications sent to this member
    const communications = await prisma.communication.findMany({
      where: {
        OR: [
          { houseId: member.houseId },
          { organizationId: organizationId, houseId: null }
        ],
        status: 'SENT' as any,
        sentAt: { not: null }
      },
      orderBy: { sentAt: 'desc' },
      take: 20
    })

    // Get audit logs for this member
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { entityId: member.id, entityType: 'HOUSE_MEMBERSHIP' },
          { entityId: member.membership.userId, entityType: 'USER' }
        ],
        houseId: member.houseId
      },
      include: {
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 30
    })

    // Get available plans for this house
    const availablePlans = await prisma.membershipPlan.findMany({
      where: {
        OR: [
          { houseId: member.houseId },
          { organizationId: organizationId, houseId: null }
        ],
        status: 'ACTIVE' as any
      },
      include: {
        prices: {
          orderBy: { amount: 'asc' }
        }
      }
    })

    return NextResponse.json({
      member,
      communications,
      auditLogs,
      availablePlans
    })
  } catch (error) {
    console.error('Get member error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string; memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updates = await req.json()
    const { role, status, membershipNumber, planChange } = updates

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
          select: { organizationId: true }
        },
        membership: {
          select: { userId: true }
        }
      }
    })

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    const updateData: any = {}
    if (role) updateData.role = role
    if (status) updateData.status = status as any
    if (membershipNumber !== undefined) updateData.membershipNumber = membershipNumber

    const updatedMember = await prisma.houseMembership.update({
      where: { id: member.id },
      data: updateData
    })

    // Handle plan change
    if (planChange) {
      const organizationId = member.house?.organizationId || ''
      
      // Deactivate old membership items
      await prisma.membershipItem.updateMany({
        where: {
          houseMembershipId: member.id,
          status: 'ACTIVE' as any
        },
        data: { status: 'CANCELLED' as any, cancelledAt: new Date() }
      })

      // Create new membership item
      await prisma.membershipItem.create({
        data: {
          organizationId: organizationId,
          houseId: member.houseId,
          houseMembershipId: member.id,
          membershipPlanId: planChange.planId,
          planPriceId: planChange.priceId,
          userId: member.membership?.userId || session.user.id,
          status: 'ACTIVE' as any,
          billingFrequency: planChange.billingFrequency,
          amount: planChange.amount,
          currency: planChange.currency || 'USD',
          startDate: new Date()
        }
      })
    }

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email || '',
        action: 'MEMBER_UPDATED',
        entityType: 'HOUSE_MEMBERSHIP',
        entityId: member.id,
        organizationId: member.house?.organizationId || '',
        houseId: member.houseId,
        metadata: { updates }
      }
    })

    return NextResponse.json({ success: true, member: updatedMember })
  } catch (error) {
    console.error('Update member error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}