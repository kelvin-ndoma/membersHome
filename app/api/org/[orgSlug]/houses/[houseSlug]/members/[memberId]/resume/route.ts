// app/api/org/[orgSlug]/houses/[houseSlug]/members/[memberId]/resume/route.ts
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
        }
      }
    })

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Update membership status
    await prisma.houseMembership.update({
      where: { id: member.id },
      data: { status: 'ACTIVE' as any }
    })

    // Update membership items
    await prisma.membershipItem.updateMany({
      where: {
        houseMembershipId: member.id,
        status: 'PAUSED'
      },
      data: {
        status: 'ACTIVE' as any,
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
        entityId: member.id,
        organizationId: member.house?.organizationId || '',
        houseId: member.houseId
      }
    })

    return NextResponse.json({ success: true, message: 'Membership resumed' })
  } catch (error) {
    console.error('Resume member error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}