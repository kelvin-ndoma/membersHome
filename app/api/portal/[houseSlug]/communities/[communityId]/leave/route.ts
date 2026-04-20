// app/api/portal/[houseSlug]/communities/[communityId]/leave/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: { houseSlug: string; communityId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { houseSlug, communityId } = params

    // Get house
    const house = await prisma.house.findFirst({
      where: { slug: houseSlug },
      select: { id: true }
    })

    if (!house) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

    // Get user's house membership
    const houseMembership = await prisma.houseMembership.findFirst({
      where: {
        houseId: house.id,
        membership: {
          userId: session.user.id
        }
      },
      select: { id: true }
    })

    if (!houseMembership) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get member record
    const member = await prisma.communityMember.findFirst({
      where: {
        communityId: communityId,
        houseMembershipId: houseMembership.id
      },
      select: {
        id: true,
        role: true,
        status: true
      }
    })

    if (!member) {
      return NextResponse.json({ error: 'Not a member of this community' }, { status: 404 })
    }

    // Check if user is the only owner
    if (member.role === 'OWNER') {
      const ownerCount = await prisma.communityMember.count({
        where: {
          communityId: communityId,
          role: 'OWNER'
        }
      })
      
      if (ownerCount === 1) {
        return NextResponse.json(
          { error: 'Cannot leave as the only owner. Transfer ownership first.' },
          { status: 400 }
        )
      }
    }

    // Remove member
    await prisma.communityMember.delete({
      where: { id: member.id }
    })

    // Update member count if they were active
    if (member.status === 'ACTIVE') {
      await prisma.community.update({
        where: { id: communityId },
        data: { memberCount: { decrement: 1 } }
      })
    }

    return NextResponse.json({ success: true, message: 'You have left the community' })
  } catch (error) {
    console.error('Error leaving community:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}