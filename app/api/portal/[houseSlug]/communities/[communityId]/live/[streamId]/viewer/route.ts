// app/api/portal/[houseSlug]/communities/[communityId]/live/[streamId]/viewer/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

export async function POST(
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
    const { action } = body // 'join' or 'leave'

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

    // Check if stream exists and is live
    const stream = await prisma.liveStream.findFirst({
      where: {
        id: streamId,
        communityId: communityId,
        status: 'LIVE'
      },
      select: { id: true }
    })

    if (!stream) {
      return NextResponse.json({ error: 'Stream not found or not live' }, { status: 404 })
    }

    if (action === 'join') {
      // Check if already viewing
      const existingViewer = await prisma.liveStreamViewer.findUnique({
        where: {
          streamId_viewerId: {
            streamId: streamId,
            viewerId: session.user.id
          }
        },
        select: { id: true }
      })

      if (!existingViewer) {
        // Add viewer
        await prisma.liveStreamViewer.create({
          data: {
            streamId: streamId,
            viewerId: session.user.id
          }
        })
        
        // Update viewer count
        await prisma.liveStream.update({
          where: { id: streamId },
          data: { viewerCount: { increment: 1 } }
        })
      }
      
      return NextResponse.json({ success: true, action: 'joined' })
    } 
    
    if (action === 'leave') {
      // Find viewer record
      const viewer = await prisma.liveStreamViewer.findUnique({
        where: {
          streamId_viewerId: {
            streamId: streamId,
            viewerId: session.user.id
          }
        },
        select: { id: true, joinedAt: true }
      })

      if (viewer) {
        // Calculate duration
        const duration = Math.floor((Date.now() - viewer.joinedAt.getTime()) / 1000)
        
        // Update viewer with leave time and duration
        await prisma.liveStreamViewer.update({
          where: { id: viewer.id },
          data: {
            leftAt: new Date(),
            duration: duration
          }
        })
        
        // Update viewer count
        await prisma.liveStream.update({
          where: { id: streamId },
          data: { viewerCount: { decrement: 1 } }
        })
      }
      
      return NextResponse.json({ success: true, action: 'left' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error tracking viewer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}