// app/api/org/[orgSlug]/houses/[houseSlug]/members/[memberId]/pause/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

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
          where: { status: 'ACTIVE' }
        }
      }
    })

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Update membership status
    await prisma.houseMembership.update({
      where: { id: member.id },
      data: { status: 'PAUSED' as any }
    })

    // Update membership items
    await prisma.membershipItem.updateMany({
      where: {
        houseMembershipId: member.id,
        status: 'ACTIVE'
      },
      data: {
        status: 'PAUSED' as any,
        pausedAt: new Date()
      }
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email || '',
        action: 'MEMBERSHIP_PAUSED',
        entityType: 'HOUSE_MEMBERSHIP',
        entityId: member.id,
        organizationId: member.house?.organizationId || '',
        houseId: member.houseId,
        metadata: { reason }
      }
    })

    return NextResponse.json({ success: true, message: 'Membership paused' })
  } catch (error) {
    console.error('Pause member error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}