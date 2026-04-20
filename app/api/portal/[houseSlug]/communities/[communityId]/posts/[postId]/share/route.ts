// app/api/portal/[houseSlug]/communities/[communityId]/posts/[postId]/share/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

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
      return NextResponse.json({ error: 'Must be a member to share' }, { status: 403 })
    }

    // Check if post exists and belongs to community
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

    // Check if already shared using findFirst (since findUnique requires composite key)
    const existingShare = await prisma.communityPostShare.findFirst({
      where: {
        postId: postId,
        userId: session.user.id
      },
      select: { id: true }
    })

    if (existingShare) {
      return NextResponse.json(
        { error: 'Already shared this post' },
        { status: 400 }
      )
    }

    // Create share
    await prisma.communityPostShare.create({
      data: {
        postId: postId,
        userId: session.user.id
      }
    })
    
    // Update share count
    await prisma.communityPost.update({
      where: { id: postId },
      data: { sharesCount: { increment: 1 } }
    })
    
    return NextResponse.json({ success: true, message: 'Post shared' })
  } catch (error) {
    console.error('Error sharing post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}