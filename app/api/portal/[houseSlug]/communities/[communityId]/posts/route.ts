// app/api/portal/[houseSlug]/communities/[communityId]/posts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'
import { ObjectId } from 'mongodb'

export async function GET(
  req: NextRequest,
  { params }: { params: { houseSlug: string; communityId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { houseSlug, communityId } = params
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

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
      return NextResponse.json({ error: 'Membership required' }, { status: 403 })
    }
    
    // Determine if communityId is an ObjectId or slug
    const isObjectId = ObjectId.isValid(communityId)
    
    // Find community by ID or slug
    const communityWhere: any = {
      houseId: house.id,
    }
    
    if (isObjectId) {
      communityWhere.id = communityId
    } else {
      communityWhere.slug = communityId
    }
    
    const community = await prisma.community.findFirst({
      where: communityWhere,
      select: { id: true }
    })

    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }
    
    // Check if user is a member
    const communityMember = await prisma.communityMember.findFirst({
      where: {
        communityId: community.id,
        houseMembershipId: houseMembership.id,
        status: 'ACTIVE'
      },
      select: { id: true, role: true }
    })

    if (!communityMember) {
      return NextResponse.json({ error: 'Must be a member to view posts' }, { status: 403 })
    }

    const posts = await prisma.communityPost.findMany({
      where: {
        communityId: community.id,
        status: 'PUBLISHED'
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
          select: {
            likes: true,
            comments: true,
            shares: true
          }
        }
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit,
      skip: offset
    })

    return NextResponse.json({
      success: true,
      posts: posts.map(post => ({
        id: post.id,
        content: post.content,
        type: post.type,
        mediaUrls: post.mediaUrls,
        thumbnailUrl: post.thumbnailUrl,
        likesCount: post._count.likes,
        commentsCount: post._count.comments,
        sharesCount: post._count.shares,
        isPinned: post.isPinned,
        isAnnouncement: post.isAnnouncement,
        createdAt: post.createdAt,
        author: {
          id: post.author.id,
          name: post.author.name,
          image: post.author.image,
          role: communityMember.role
        },
        likedByUser: post.likes.length > 0
      }))
    })
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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
    const body = await req.json()
    const { content, type, mediaUrls, isAnnouncement } = body

    if (!content && (!mediaUrls || mediaUrls.length === 0)) {
      return NextResponse.json(
        { error: 'Post content or media required' },
        { status: 400 }
      )
    }

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
      return NextResponse.json({ error: 'Membership required' }, { status: 403 })
    }
    
    // Determine if communityId is an ObjectId or slug
    const isObjectId = ObjectId.isValid(communityId)
    
    const communityWhere: any = {
      houseId: house.id,
    }
    
    if (isObjectId) {
      communityWhere.id = communityId
    } else {
      communityWhere.slug = communityId
    }
    
    const community = await prisma.community.findFirst({
      where: communityWhere,
      select: { id: true }
    })

    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }
    
    // Check if user is an active member
    const communityMember = await prisma.communityMember.findFirst({
      where: {
        communityId: community.id,
        houseMembershipId: houseMembership.id,
        status: 'ACTIVE'
      },
      select: { id: true, role: true }
    })

    if (!communityMember) {
      return NextResponse.json({ error: 'Must be a member to post' }, { status: 403 })
    }

    // Check if user can make announcements (only admins/owners/moderators)
    if (isAnnouncement && !['OWNER', 'ADMIN', 'MODERATOR'].includes(communityMember.role)) {
      return NextResponse.json(
        { error: 'Only moderators can make announcements' },
        { status: 403 }
      )
    }

    const post = await prisma.communityPost.create({
      data: {
        communityId: community.id,
        authorId: session.user.id,
        content: content || null,
        type: type || 'TEXT',
        mediaUrls: mediaUrls || [],
        isAnnouncement: isAnnouncement || false,
        status: 'PUBLISHED'
      },
      select: {
        id: true,
        content: true,
        type: true,
        mediaUrls: true,
        isAnnouncement: true,
        createdAt: true
      }
    })

    // Update post count
    await prisma.community.update({
      where: { id: community.id },
      data: { postCount: { increment: 1 } }
    })

    return NextResponse.json({
      success: true,
      post: post
    })
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}