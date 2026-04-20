// app/api/portal/[houseSlug]/communities/[communityId]/members/[memberId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

export async function PUT(
  req: NextRequest,
  { params }: { params: { houseSlug: string; communityId: string; memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { houseSlug, communityId, memberId } = params
    const body = await req.json()
    const { role } = body

    if (!role || !['MEMBER', 'MODERATOR', 'ADMIN', 'OWNER'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Get house
    const house = await prisma.house.findFirst({
      where: { slug: houseSlug },
      select: { id: true }
    })

    if (!house) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

    // Get user's house membership
    const currentUserHouseMembership = await prisma.houseMembership.findFirst({
      where: {
        houseId: house.id,
        membership: {
          userId: session.user.id
        }
      },
      select: { id: true, status: true }
    })

    if (!currentUserHouseMembership || currentUserHouseMembership.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Active membership required' }, { status: 403 })
    }
    
    // Check permissions - only OWNER and ADMIN can change roles
    const currentMember = await prisma.communityMember.findFirst({
      where: {
        communityId: communityId,
        houseMembershipId: currentUserHouseMembership.id,
        role: { in: ['OWNER', 'ADMIN'] }
      },
      select: { id: true, role: true, userId: true }
    })

    if (!currentMember) {
      return NextResponse.json({ error: 'Unauthorized - Admin or Owner role required' }, { status: 403 })
    }

    // Get target member
    const targetMember = await prisma.communityMember.findFirst({
      where: {
        id: memberId,
        communityId: communityId
      },
      select: { 
        id: true, 
        role: true, 
        userId: true,
        status: true 
      }
    })

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Cannot change OWNER role unless you're the OWNER
    if (targetMember.role === 'OWNER' && currentMember.role !== 'OWNER') {
      return NextResponse.json({ error: 'Only owner can modify owner role' }, { status: 403 })
    }

    // Cannot demote yourself if you're the only owner
    if (targetMember.userId === session.user.id && role !== 'OWNER') {
      const ownerCount = await prisma.communityMember.count({
        where: {
          communityId: communityId,
          role: 'OWNER'
        }
      })
      if (ownerCount === 1) {
        return NextResponse.json(
          { error: 'Cannot demote yourself as the only owner' },
          { status: 400 }
        )
      }
    }

    // Cannot promote to OWNER if there's already an owner (unless you're the owner)
    if (role === 'OWNER' && currentMember.role !== 'OWNER') {
      const existingOwner = await prisma.communityMember.findFirst({
        where: {
          communityId: communityId,
          role: 'OWNER'
        },
        select: { id: true }
      })
      if (existingOwner) {
        return NextResponse.json(
          { error: 'Community already has an owner. Transfer ownership first.' },
          { status: 400 }
        )
      }
    }

    // Update role
    await prisma.communityMember.update({
      where: { id: memberId },
      data: { role: role }
    })

    return NextResponse.json({ success: true, message: 'Role updated successfully' })
  } catch (error) {
    console.error('Error updating member role:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { houseSlug: string; communityId: string; memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { houseSlug, communityId, memberId } = params

    // Get house
    const house = await prisma.house.findFirst({
      where: { slug: houseSlug },
      select: { id: true }
    })

    if (!house) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

    // Get user's house membership
    const currentUserHouseMembership = await prisma.houseMembership.findFirst({
      where: {
        houseId: house.id,
        membership: {
          userId: session.user.id
        }
      },
      select: { id: true, status: true }
    })

    if (!currentUserHouseMembership || currentUserHouseMembership.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Active membership required' }, { status: 403 })
    }
    
    // Check current member's role
    const currentMember = await prisma.communityMember.findFirst({
      where: {
        communityId: communityId,
        houseMembershipId: currentUserHouseMembership.id
      },
      select: { id: true, role: true, userId: true }
    })

    if (!currentMember) {
      return NextResponse.json({ error: 'Unauthorized - Not a community member' }, { status: 403 })
    }

    // Get target member
    const targetMember = await prisma.communityMember.findFirst({
      where: {
        id: memberId,
        communityId: communityId
      },
      select: { 
        id: true, 
        role: true, 
        userId: true,
        status: true 
      }
    })

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Check if user can remove this member
    const isSelf = targetMember.userId === session.user.id
    const isOwner = currentMember.role === 'OWNER'
    const isAdmin = currentMember.role === 'ADMIN'
    const isTargetOwner = targetMember.role === 'OWNER'
    const isTargetModerator = targetMember.role === 'MODERATOR'

    // Permission logic
    let canRemove = false
    
    if (isSelf) {
      canRemove = true // Users can always remove themselves
    } else if (isOwner) {
      canRemove = true // Owner can remove anyone
    } else if (isAdmin && !isTargetOwner) {
      canRemove = true // Admin can remove non-owners
    } else if (currentMember.role === 'MODERATOR' && (targetMember.role === 'MEMBER' || targetMember.role === 'MODERATOR')) {
      canRemove = false // Moderators cannot remove members (read-only role)
    }

    if (!canRemove) {
      return NextResponse.json({ error: 'Unauthorized to remove this member' }, { status: 403 })
    }

    // Cannot remove the last owner
    if (isTargetOwner) {
      const ownerCount = await prisma.communityMember.count({
        where: {
          communityId: communityId,
          role: 'OWNER'
        }
      })
      if (ownerCount === 1) {
        return NextResponse.json(
          { error: 'Cannot remove the only owner. Transfer ownership first.' },
          { status: 400 }
        )
      }
    }

    // Store status before deletion for member count update
    const wasActive = targetMember.status === 'ACTIVE'

    // Remove member
    await prisma.communityMember.delete({
      where: { id: memberId }
    })

    // Update member count if they were active
    if (wasActive) {
      await prisma.community.update({
        where: { id: communityId },
        data: { memberCount: { decrement: 1 } }
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: isSelf ? 'You have left the community' : 'Member removed successfully' 
    })
  } catch (error) {
    console.error('Error removing member:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}