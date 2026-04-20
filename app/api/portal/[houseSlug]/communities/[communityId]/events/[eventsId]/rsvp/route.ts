// app/api/portal/[houseSlug]/communities/[communityId]/events/[eventId]/rsvp/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'
import { ObjectId } from 'mongodb'

export async function POST(
  req: NextRequest,
  { params }: { params: { houseSlug: string; communityId: string; eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { houseSlug, communityId, eventId } = params
    const body = await req.json()
    const { status } = body // 'CONFIRMED' or 'CANCELLED'

    if (!status || !['CONFIRMED', 'CANCELLED'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status (CONFIRMED or CANCELLED) is required' },
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

    // Find community
    const isObjectId = ObjectId.isValid(communityId)
    const communityWhere: any = { houseId: house.id }
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
      select: { id: true }
    })

    if (!communityMember) {
      return NextResponse.json({ error: 'Must be a member to RSVP' }, { status: 403 })
    }

    // Get event
    const event = await prisma.communityEvent.findFirst({
      where: {
        id: eventId,
        communityId: community.id,
        status: 'SCHEDULED'
      },
      select: {
        id: true,
        requiresRSVP: true,
        maxAttendees: true,
        startAt: true
      }
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found or not available for RSVP' }, { status: 404 })
    }

    if (!event.requiresRSVP) {
      return NextResponse.json({ error: 'This event does not require RSVP' }, { status: 400 })
    }

    if (new Date(event.startAt) < new Date()) {
      return NextResponse.json({ error: 'Cannot RSVP to past events' }, { status: 400 })
    }

    // Check if user already has an RSVP
    const existingRSVP = await prisma.communityEventRSVP.findFirst({
      where: {
        eventId: event.id,
        memberId: communityMember.id
      },
      select: { id: true, status: true }
    })

    if (status === 'CONFIRMED') {
      // Check capacity
      if (event.maxAttendees) {
        const currentCount = await prisma.communityEventRSVP.count({
          where: {
            eventId: event.id,
            status: 'CONFIRMED'
          }
        })
        
        if (currentCount >= event.maxAttendees) {
          return NextResponse.json(
            { error: 'Event has reached maximum capacity' },
            { status: 400 }
          )
        }
      }

      if (existingRSVP) {
        // Update existing RSVP to CONFIRMED
        await prisma.communityEventRSVP.update({
          where: { id: existingRSVP.id },
          data: { status: 'CONFIRMED' }
        })
      } else {
        // Create new RSVP
        await prisma.communityEventRSVP.create({
          data: {
            eventId: event.id,
            memberId: communityMember.id,
            userId: session.user.id,
            status: 'CONFIRMED'
          }
        })
      }
    } else if (status === 'CANCELLED') {
      if (existingRSVP) {
        // Cancel RSVP
        await prisma.communityEventRSVP.update({
          where: { id: existingRSVP.id },
          data: { status: 'CANCELLED' }
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: status === 'CONFIRMED' ? 'Successfully RSVPed to event' : 'RSVP cancelled'
    })
  } catch (error) {
    console.error('Error processing RSVP:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}