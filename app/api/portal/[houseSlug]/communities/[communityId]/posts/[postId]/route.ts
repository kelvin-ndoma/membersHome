// app/api/portal/[houseSlug]/communities/[communityId]/posts/[postId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

export async function PUT(
  req: NextRequest,
  { params }: { params: { houseSlug: string; communityId: string; postId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { houseSlug, communityId, postId } = params
    const body = await req.json()
    const { isPinned, isAnnouncement } = body

    const house = await prisma.house.findFirst({
      where: { slug: houseSlug },
      select: { id: true }
    })

    if (!house) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

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
    
    // Check if user is moderator/admin/owner
    const communityMember = await prisma.communityMember.findFirst({
      where: {
        communityId: communityId,
        houseMembershipId: houseMembership.id,
        role: { in: ['OWNER', 'ADMIN', 'MODERATOR'] }
      },
      select: { id: true, role: true }
    })

    if (!communityMember) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const post = await prisma.communityPost.findFirst({
      where: {
        id: postId,
        communityId: communityId
      },
      select: { id: true, authorId: true }
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const updated = await prisma.communityPost.update({
      where: { id: postId },
      data: {
        isPinned: isPinned !== undefined ? isPinned : undefined,
        isAnnouncement: isAnnouncement !== undefined ? isAnnouncement : undefined
      },
      select: {
        id: true,
        isPinned: true,
        isAnnouncement: true
      }
    })

    return NextResponse.json({ success: true, post: updated })
  } catch (error) {
    console.error('Error updating post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { houseSlug: string; communityId: string; postId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { houseSlug, communityId, postId } = params

    const house = await prisma.house.findFirst({
      where: { slug: houseSlug },
      select: { id: true }
    })

    if (!house) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

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
    
    // Check permissions
    const communityMember = await prisma.communityMember.findFirst({
      where: {
        communityId: communityId,
        houseMembershipId: houseMembership.id
      },
      select: { id: true, role: true }
    })

    if (!communityMember) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const post = await prisma.communityPost.findFirst({
      where: {
        id: postId,
        communityId: communityId
      },
      select: { id: true, authorId: true }
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Check if user can delete (author or moderator/admin/owner)
    const canDelete = post.authorId === session.user.id ||
      ['OWNER', 'ADMIN', 'MODERATOR'].includes(communityMember.role)

    if (!canDelete) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Soft delete
    await prisma.communityPost.update({
      where: { id: postId },
      data: { status: 'DELETED' }
    })

    // Update post count
    await prisma.community.update({
      where: { id: communityId },
      data: { postCount: { decrement: 1 } }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}