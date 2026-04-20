// app/api/portal/[houseSlug]/communities/[communityId]/live/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

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
    const status = searchParams.get('status') || 'LIVE'

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
      return NextResponse.json({ error: 'Must be a member to view streams' }, { status: 403 })
    }

    const streams = await prisma.liveStream.findMany({
      where: {
        communityId: communityId,
        status: status as any
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        _count: {
          select: {
            viewers: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      streams: streams.map(stream => ({
        id: stream.id,
        title: stream.title,
        description: stream.description,
        thumbnail: stream.thumbnail,
        streamUrl: stream.streamUrl,
        viewerCount: stream._count.viewers,
        status: stream.status,
        scheduledFor: stream.scheduledFor,
        startedAt: stream.startedAt,
        host: {
          id: stream.host.id,
          name: stream.host.name,
          image: stream.host.image
        }
      }))
    })
  } catch (error) {
    console.error('Error fetching streams:', error)
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
    const { title, description, thumbnail, scheduledFor, chatEnabled, chatModeration, recordStream } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
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
      select: { id: true }
    })

    if (!houseMembership) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check if user can host streams (admin/moderator or specific permission)
    const communityMember = await prisma.communityMember.findFirst({
      where: {
        communityId: communityId,
        houseMembershipId: houseMembership.id,
        role: { in: ['OWNER', 'ADMIN', 'MODERATOR'] }
      },
      select: { id: true }
    })

    if (!communityMember) {
      return NextResponse.json({ error: 'Only moderators can host live streams' }, { status: 403 })
    }

    // Generate stream key
    const streamKey = randomBytes(16).toString('hex')

    // Create stream URL (you would replace with your streaming service URL)
    const streamUrl = `rtmp://your-streaming-server/live/${streamKey}`

    const stream = await prisma.liveStream.create({
      data: {
        communityId: communityId,
        hostId: session.user.id,
        title,
        description: description || null,
        thumbnail: thumbnail || null,
        streamUrl,
        streamKey,
        chatEnabled: chatEnabled ?? true,
        chatModeration: chatModeration ?? false,
        recordStream: recordStream ?? false,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        status: scheduledFor ? 'SCHEDULED' : 'SCHEDULED'
      },
      select: {
        id: true,
        title: true,
        streamKey: true,
        streamUrl: true,
        status: true
      }
    })

    return NextResponse.json({
      success: true,
      stream: {
        id: stream.id,
        title: stream.title,
        streamKey: stream.streamKey,
        streamUrl: stream.streamUrl,
        status: stream.status
      }
    })
  } catch (error) {
    console.error('Error creating stream:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}