// app/api/portal/[houseSlug]/communities/[communityId]/posts/[postId]/comments/[commentId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { houseSlug: string; communityId: string; postId: string; commentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { houseSlug, communityId, postId, commentId } = params

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
      select: { id: true, status: true }
    })

    if (!houseMembership || houseMembership.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Active membership required' }, { status: 403 })
    }
    
    // Check user's role in community
    const communityMember = await prisma.communityMember.findFirst({
      where: {
        communityId: communityId,
        houseMembershipId: houseMembership.id
      },
      select: { id: true, role: true }
    })

    if (!communityMember) {
      return NextResponse.json({ error: 'Unauthorized - Not a community member' }, { status: 403 })
    }

    // Check if comment exists and belongs to the post
    const comment = await prisma.communityComment.findFirst({
      where: {
        id: commentId,
        postId: postId
      },
      select: { 
        id: true, 
        authorId: true,
        status: true
      }
    })

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    // Check if comment is already deleted
    if (comment.status === 'DELETED') {
      return NextResponse.json({ error: 'Comment already deleted' }, { status: 400 })
    }

    // Check if user can delete (author or moderator/admin/owner)
    const canDelete = comment.authorId === session.user.id ||
      ['OWNER', 'ADMIN', 'MODERATOR'].includes(communityMember.role)

    if (!canDelete) {
      return NextResponse.json({ error: 'Unauthorized - Cannot delete this comment' }, { status: 403 })
    }

    // Soft delete the comment
    await prisma.communityComment.update({
      where: { id: commentId },
      data: { status: 'DELETED' }
    })

    // Update comment count on the post (only if the comment wasn't already deleted)
    await prisma.communityPost.update({
      where: { id: postId },
      data: { commentsCount: { decrement: 1 } }
    })

    // Also soft delete any replies to this comment
    await prisma.communityComment.updateMany({
      where: {
        parentId: commentId,
        status: 'ACTIVE'
      },
      data: { status: 'DELETED' }
    })

    // Get count of replies that were soft deleted
    const deletedReplies = await prisma.communityComment.count({
      where: {
        parentId: commentId,
        status: 'DELETED'
      }
    })

    // Update comment count to reflect deleted replies
    if (deletedReplies > 0) {
      await prisma.communityPost.update({
        where: { id: postId },
        data: { commentsCount: { decrement: deletedReplies } }
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Comment and its replies deleted successfully',
      deletedRepliesCount: deletedReplies
    })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}