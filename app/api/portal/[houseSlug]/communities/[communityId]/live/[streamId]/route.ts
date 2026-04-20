// app/api/portal/[houseSlug]/communities/[communityId]/live/[streamId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { houseSlug: string; communityId: string; streamId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { houseSlug, communityId, streamId } = params

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
      return NextResponse.json({ error: 'Must be a member to view stream' }, { status: 403 })
    }

    const stream = await prisma.liveStream.findFirst({
      where: {
        id: streamId,
        communityId: communityId
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        viewers: {
          where: {
            viewerId: session.user.id
          },
          select: {
            id: true,
            joinedAt: true
          }
        },
        _count: {
          select: {
            viewers: true
          }
        }
      }
    })

    if (!stream) {
      return NextResponse.json({ error: 'Stream not found' }, { status: 404 })
    }

    const isViewing = stream.viewers.length > 0

    return NextResponse.json({
      success: true,
      stream: {
        id: stream.id,
        title: stream.title,
        description: stream.description,
        thumbnail: stream.thumbnail,
        streamUrl: stream.streamUrl,
        viewerCount: stream._count.viewers,
        chatEnabled: stream.chatEnabled,
        chatModeration: stream.chatModeration,
        status: stream.status,
        scheduledFor: stream.scheduledFor,
        startedAt: stream.startedAt,
        endedAt: stream.endedAt,
        recordingUrl: stream.recordingUrl,
        host: {
          id: stream.host.id,
          name: stream.host.name,
          image: stream.host.image
        },
        isViewing: isViewing
      }
    })
  } catch (error) {
    console.error('Error fetching stream:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { houseSlug: string; communityId: string; streamId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { houseSlug, communityId, streamId } = params
    const body = await req.json()
    const { status, recordingUrl } = body

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

    // Check if user is the host or admin
    const stream = await prisma.liveStream.findFirst({
      where: {
        id: streamId,
        communityId: communityId
      },
      select: {
        id: true,
        hostId: true
      }
    })

    if (!stream) {
      return NextResponse.json({ error: 'Stream not found' }, { status: 404 })
    }

    const isHost = stream.hostId === session.user.id
    
    const communityMember = await prisma.communityMember.findFirst({
      where: {
        communityId: communityId,
        houseMembershipId: houseMembership.id,
        role: { in: ['OWNER', 'ADMIN'] }
      },
      select: { id: true }
    })

    if (!isHost && !communityMember) {
      return NextResponse.json({ error: 'Only host or admin can update stream' }, { status: 403 })
    }

    const updateData: any = {}
    
    if (status === 'LIVE') {
      updateData.status = 'LIVE'
      updateData.startedAt = new Date()
    } else if (status === 'ENDED') {
      updateData.status = 'ENDED'
      updateData.endedAt = new Date()
    } else if (status === 'CANCELLED') {
      updateData.status = 'CANCELLED'
    }
    
    if (recordingUrl) {
      updateData.recordingUrl = recordingUrl
    }

    const updated = await prisma.liveStream.update({
      where: { id: streamId },
      data: updateData,
      select: {
        id: true,
        status: true,
        startedAt: true,
        endedAt: true,
        recordingUrl: true
      }
    })

    return NextResponse.json({ success: true, stream: updated })
  } catch (error) {
    console.error('Error updating stream:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}