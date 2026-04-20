// app/api/portal/[houseSlug]/communities/[communityId]/events/[eventId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'
import { ObjectId } from 'mongodb'

export async function GET(
  req: NextRequest,
  { params }: { params: { houseSlug: string; communityId: string; eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { houseSlug, communityId, eventId } = params

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
      return NextResponse.json({ error: 'Must be a member to view events' }, { status: 403 })
    }

    // Get event
    const event = await prisma.communityEvent.findFirst({
      where: {
        id: eventId,
        communityId: community.id
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        rsvps: {
          where: {
            member: {
              houseMembershipId: houseMembership.id
            }
          },
          select: {
            id: true,
            status: true
          }
        },
        _count: {
          select: {
            rsvps: true
          }
        }
      }
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        location: event.location,
        onlineUrl: event.onlineUrl,
        startAt: event.startAt,
        endAt: event.endAt,
        isVirtual: event.isVirtual,
        requiresRSVP: event.requiresRSVP,
        maxAttendees: event.maxAttendees,
        attendeeCount: event._count.rsvps,
        status: event.status,
        organizer: {
          id: event.organizer.id,
          name: event.organizer.name,
          image: event.organizer.image
        },
        userRSVP: event.rsvps[0] ? {
          id: event.rsvps[0].id,
          status: event.rsvps[0].status
        } : null
      }
    })
  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
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
    const {
      title,
      description,
      location,
      onlineUrl,
      startAt,
      endAt,
      isVirtual,
      requiresRSVP,
      maxAttendees,
      status
    } = body

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

    // Check if user can edit event (organizer or admin/moderator)
    const event = await prisma.communityEvent.findFirst({
      where: {
        id: eventId,
        communityId: community.id
      },
      select: {
        id: true,
        organizerId: true
      }
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const communityMember = await prisma.communityMember.findFirst({
      where: {
        communityId: community.id,
        houseMembershipId: houseMembership.id,
        role: { in: ['OWNER', 'ADMIN', 'MODERATOR'] }
      },
      select: { id: true }
    })

    const isOrganizer = event.organizerId === session.user.id
    const canEdit = isOrganizer || !!communityMember

    if (!canEdit) {
      return NextResponse.json(
        { error: 'Only organizers or moderators can edit events' },
        { status: 403 }
      )
    }

    // Update event
    const updatedEvent = await prisma.communityEvent.update({
      where: { id: eventId },
      data: {
        title: title !== undefined ? title : undefined,
        description: description !== undefined ? description : undefined,
        location: isVirtual ? null : location,
        onlineUrl: isVirtual ? onlineUrl : null,
        startAt: startAt ? new Date(startAt) : undefined,
        endAt: endAt ? new Date(endAt) : undefined,
        isVirtual: isVirtual !== undefined ? isVirtual : undefined,
        requiresRSVP: requiresRSVP !== undefined ? requiresRSVP : undefined,
        maxAttendees: maxAttendees !== undefined ? (maxAttendees ? parseInt(maxAttendees) : null) : undefined,
        status: status !== undefined ? status : undefined
      },
      select: {
        id: true,
        title: true,
        startAt: true,
        status: true
      }
    })

    return NextResponse.json({
      success: true,
      event: updatedEvent,
      message: 'Event updated successfully'
    })
  } catch (error) {
    console.error('Error updating event:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { houseSlug: string; communityId: string; eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { houseSlug, communityId, eventId } = params

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

    // Check if user can delete event (organizer or admin)
    const event = await prisma.communityEvent.findFirst({
      where: {
        id: eventId,
        communityId: community.id
      },
      select: {
        id: true,
        organizerId: true
      }
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const communityMember = await prisma.communityMember.findFirst({
      where: {
        communityId: community.id,
        houseMembershipId: houseMembership.id,
        role: { in: ['OWNER', 'ADMIN'] }
      },
      select: { id: true }
    })

    const isOrganizer = event.organizerId === session.user.id
    const canDelete = isOrganizer || !!communityMember

    if (!canDelete) {
      return NextResponse.json(
        { error: 'Only organizers or admins can delete events' },
        { status: 403 }
      )
    }

    // Delete event
    await prisma.communityEvent.delete({
      where: { id: eventId }
    })

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}