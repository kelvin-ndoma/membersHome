// app/api/portal/[houseSlug]/communities/[communityId]/join/route.ts
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
      select: {
        id: true,
        status: true
      }
    })

    if (!houseMembership || houseMembership.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Active membership required' },
        { status: 403 }
      )
    }

    // Get community
    const community = await prisma.community.findFirst({
      where: {
        id: communityId,
        houseId: house.id,
        status: 'ACTIVE'
      },
      select: {
        id: true,
        isPrivate: true,
        requiresApproval: true,
        maxMembers: true,
        memberCount: true
      }
    })

    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }

    // Check if already a member or pending
    const existing = await prisma.communityMember.findFirst({
      where: {
        communityId: community.id,
        houseMembershipId: houseMembership.id
      },
      select: {
        id: true,
        status: true
      }
    })

    if (existing) {
      if (existing.status === 'ACTIVE') {
        return NextResponse.json(
          { error: 'Already a member' },
          { status: 400 }
        )
      }
      if (existing.status === 'PENDING') {
        return NextResponse.json(
          { error: 'Join request already pending' },
          { status: 400 }
        )
      }
    }

    // Check member limit
    if (community.maxMembers && community.memberCount >= community.maxMembers) {
      return NextResponse.json(
        { error: 'Community has reached maximum members' },
        { status: 400 }
      )
    }

    // Determine member status based on approval requirement
    const memberStatus = community.requiresApproval ? 'PENDING' : 'ACTIVE'

    // Create membership
    const membership = await prisma.communityMember.create({
      data: {
        communityId: community.id,
        houseMembershipId: houseMembership.id,
        userId: session.user.id,
        role: 'MEMBER',
        status: memberStatus
      }
    })

    // If auto-approved, update member count
    if (memberStatus === 'ACTIVE') {
      await prisma.community.update({
        where: { id: community.id },
        data: { memberCount: { increment: 1 } }
      })
    }

    return NextResponse.json({
      success: true,
      status: memberStatus,
      message: memberStatus === 'ACTIVE' 
        ? 'Successfully joined community' 
        : 'Join request submitted for approval'
    })
  } catch (error) {
    console.error('Error joining community:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}