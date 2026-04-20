// app/api/portal/[houseSlug]/communities/[communityId]/events/route.ts
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
    const filter = searchParams.get('filter') || 'upcoming'

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

    // Find community by ID or slug
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

    // Build date filter
    const now = new Date()
    let dateFilter: any = {}

    if (filter === 'upcoming') {
      dateFilter = { startAt: { gte: now } }
    } else if (filter === 'past') {
      dateFilter = { endAt: { lt: now } }
    }

    // Get events
    const events = await prisma.communityEvent.findMany({
      where: {
        communityId: community.id,
        ...dateFilter
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
      },
      orderBy: {
        startAt: filter === 'upcoming' ? 'asc' : 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      events: events.map(event => ({
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
      }))
    })
  } catch (error) {
    console.error('Error fetching events:', error)
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
    const {
      title,
      description,
      location,
      onlineUrl,
      startAt,
      endAt,
      isVirtual,
      requiresRSVP,
      maxAttendees
    } = body

    if (!title || !startAt || !endAt) {
      return NextResponse.json(
        { error: 'Title, start date, and end date are required' },
        { status: 400 }
      )
    }

    if (new Date(startAt) >= new Date(endAt)) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
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

    // Check if user can create events (admin/moderator or specific permission)
    const communityMember = await prisma.communityMember.findFirst({
      where: {
        communityId: community.id,
        houseMembershipId: houseMembership.id,
        role: { in: ['OWNER', 'ADMIN', 'MODERATOR'] }
      },
      select: { id: true }
    })

    if (!communityMember) {
      return NextResponse.json(
        { error: 'Only moderators can create events' },
        { status: 403 }
      )
    }

    // Create event
    const event = await prisma.communityEvent.create({
      data: {
        communityId: community.id,
        organizerId: session.user.id,
        title,
        description: description || null,
        location: isVirtual ? null : location,
        onlineUrl: isVirtual ? onlineUrl : null,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        isVirtual: isVirtual || false,
        requiresRSVP: requiresRSVP ?? true,
        maxAttendees: maxAttendees ? parseInt(maxAttendees) : null,
        status: 'SCHEDULED'
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
      event,
      message: 'Event created successfully'
    })
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}