// app/api/portal/[houseSlug]/communities/[communityId]/posts/[postId]/comments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { houseSlug: string; communityId: string; postId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { houseSlug, communityId, postId } = params

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
    
    // Check if user is a member of the community
    const communityMember = await prisma.communityMember.findFirst({
      where: {
        communityId: communityId,
        houseMembershipId: houseMembership.id,
        status: 'ACTIVE'
      },
      select: { id: true }
    })

    if (!communityMember) {
      return NextResponse.json({ error: 'Must be a member to view comments' }, { status: 403 })
    }

    // Check if post exists
    const post = await prisma.communityPost.findFirst({
      where: {
        id: postId,
        communityId: communityId
      },
      select: { id: true }
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Get comments with their replies
    const comments = await prisma.communityComment.findMany({
      where: {
        postId: postId,
        parentId: null,
        status: 'ACTIVE'
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        likes: {
          where: {
            userId: session.user.id
          },
          select: { id: true }
        },
        _count: {
          select: { likes: true }
        },
        replies: {
          where: {
            status: 'ACTIVE'
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true
              }
            },
            likes: {
              where: {
                userId: session.user.id
              },
              select: { id: true }
            },
            _count: {
              select: { likes: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json({
      success: true,
      comments: comments.map(comment => ({
        id: comment.id,
        content: comment.content,
        mediaUrl: comment.mediaUrl,
        createdAt: comment.createdAt,
        author: {
          id: comment.author.id,
          name: comment.author.name,
          image: comment.author.image
        },
        likesCount: comment._count.likes,
        likedByUser: comment.likes.length > 0,
        replies: comment.replies.map(reply => ({
          id: reply.id,
          content: reply.content,
          mediaUrl: reply.mediaUrl,
          createdAt: reply.createdAt,
          author: {
            id: reply.author.id,
            name: reply.author.name,
            image: reply.author.image
          },
          likesCount: reply._count.likes,
          likedByUser: reply.likes.length > 0
        }))
      }))
    })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
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
    const { content, parentId, mediaUrl } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content required' },
        { status: 400 }
      )
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
    
    // Check if user is a member of the community
    const communityMember = await prisma.communityMember.findFirst({
      where: {
        communityId: communityId,
        houseMembershipId: houseMembership.id,
        status: 'ACTIVE'
      },
      select: { id: true }
    })

    if (!communityMember) {
      return NextResponse.json({ error: 'Must be a member to comment' }, { status: 403 })
    }

    // Check if post exists
    const post = await prisma.communityPost.findFirst({
      where: {
        id: postId,
        communityId: communityId,
        status: 'PUBLISHED'
      },
      select: { id: true }
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // If replying to a comment, check if parent comment exists
    if (parentId) {
      const parentComment = await prisma.communityComment.findFirst({
        where: {
          id: parentId,
          postId: postId,
          status: 'ACTIVE'
        },
        select: { id: true }
      })

      if (!parentComment) {
        return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 })
      }
    }

    const comment = await prisma.communityComment.create({
      data: {
        postId: postId,
        authorId: session.user.id,
        content: content.trim(),
        mediaUrl: mediaUrl || null,
        parentId: parentId || null,
        status: 'ACTIVE'
      },
      select: {
        id: true,
        content: true,
        mediaUrl: true,
        parentId: true,
        createdAt: true,
        authorId: true
      }
    })

    // Update comment count on post
    await prisma.communityPost.update({
      where: { id: postId },
      data: { commentsCount: { increment: 1 } }
    })

    // Get the created comment with author info for response
    const commentWithAuthor = await prisma.communityComment.findUnique({
      where: { id: comment.id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      comment: {
        id: commentWithAuthor?.id,
        content: commentWithAuthor?.content,
        mediaUrl: commentWithAuthor?.mediaUrl,
        parentId: commentWithAuthor?.parentId,
        createdAt: commentWithAuthor?.createdAt,
        author: {
          id: commentWithAuthor?.author.id,
          name: commentWithAuthor?.author.name,
          image: commentWithAuthor?.author.image
        },
        likesCount: 0,
        likedByUser: false
      }
    })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}