// app/api/org/[orgSlug]/houses/[houseSlug]/events/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const upcoming = searchParams.get('upcoming') === 'true'

    const house = await prisma.house.findFirst({
      where: {
        slug: params.houseSlug,
        organization: { slug: params.orgSlug }
      },
      select: { id: true, organizationId: true }
    })

    if (!house) {
      return NextResponse.json(
        { error: 'House not found' },
        { status: 404 }
      )
    }

    const where: any = { 
      OR: [
        { houseId: house.id },
        { organizationId: house.organizationId, houseId: null }
      ]
    }
    
    if (status) where.status = status
    if (type) where.type = type
    if (upcoming) {
      where.startDate = { gte: new Date() }
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { startDate: upcoming ? 'asc' : 'desc' },
        include: {
          _count: {
            select: { rsvps: true }
          },
          rsvps: {
            where: {
              houseMembership: {
                membership: { userId: session.user.id }
              }
            },
            select: { status: true }
          },
          creator: {
            select: { name: true, email: true }
          },
          house: {
            select: { name: true, slug: true }
          }
        }
      }),
      prisma.event.count({ where })
    ])

    const eventsWithUserRsvp = events.map(event => ({
      ...event,
      userRsvpStatus: event.rsvps[0]?.status || null,
    }))

    return NextResponse.json({
      events: eventsWithUserRsvp,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get events error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const house = await prisma.house.findFirst({
      where: {
        slug: params.houseSlug,
        organization: { slug: params.orgSlug }
      },
      include: {
        members: {
          where: {
            membership: { userId: session.user.id },
            role: { in: ['HOUSE_MANAGER', 'HOUSE_ADMIN', 'HOUSE_STAFF'] }
          }
        }
      }
    })

    if (!house) {
      return NextResponse.json(
        { error: 'House not found' },
        { status: 404 }
      )
    }

    if (house.members.length === 0) {
      return NextResponse.json(
        { error: 'Unauthorized - Staff access required' },
        { status: 403 }
      )
    }

    const {
      title,
      slug,
      description,
      imageUrl,
      startDate,
      endDate,
      timezone,
      location,
      address,
      onlineUrl,
      type,
      isFree,
      capacity,
      price,
      currency,
      memberOnly,
    } = await req.json()

    if (!title || !startDate) {
      return NextResponse.json(
        { error: 'Title and start date are required' },
        { status: 400 }
      )
    }

    // Generate slug if not provided
    const eventSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    
    // Check if slug is unique within org
    const existingEvent = await prisma.event.findFirst({
      where: {
        organizationId: house.organizationId,
        slug: eventSlug
      }
    })

    if (existingEvent) {
      return NextResponse.json(
        { error: 'Event slug already exists' },
        { status: 400 }
      )
    }

    const event = await prisma.event.create({
      data: {
        title,
        slug: eventSlug,
        description,
        imageUrl,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : new Date(startDate),
        timezone: timezone || 'UTC',
        location,
        address,
        onlineUrl,
        type: type || 'IN_PERSON',
        isFree: isFree || false,
        capacity,
        price: price || 0,
        currency: currency || 'USD',
        memberOnly: memberOnly || false,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        organizationId: house.organizationId,
        houseId: house.id,
        createdBy: session.user.id,
      }
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: 'EVENT_CREATED',
        entityType: 'EVENT',
        entityId: event.id,
        organizationId: house.organizationId,
        houseId: house.id,
        metadata: { title, startDate }
      }
    })

    return NextResponse.json({
      success: true,
      event
    }, { status: 201 })
  } catch (error) {
    console.error('Create event error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}