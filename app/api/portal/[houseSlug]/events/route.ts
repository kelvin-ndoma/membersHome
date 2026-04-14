// app/api/portal/[houseSlug]/events/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { houseSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const upcoming = searchParams.get('upcoming') === 'true'
    const type = searchParams.get('type')

    // Find the house through user's memberships
    const userMemberships = await prisma.membership.findMany({
      where: {
        userId: session.user.id,
        status: 'ACTIVE'
      },
      include: {
        houseMemberships: {
          where: {
            status: 'ACTIVE',
            house: { slug: params.houseSlug }
          },
          include: { house: true }
        }
      }
    })

    let targetHouse = null
    let memberAccess = null

    for (const membership of userMemberships) {
      const hm = membership.houseMemberships[0]
      if (hm) {
        targetHouse = hm.house
        memberAccess = hm
        break
      }
    }

    if (!targetHouse) {
      return NextResponse.json({ error: 'House not found or not a member' }, { status: 404 })
    }

    const where: any = {
      OR: [
        { houseId: targetHouse.id },
        { organizationId: targetHouse.organizationId, houseId: null }
      ],
      status: 'PUBLISHED'
    }

    // Filter by member only - show all if member, only non-member events if not logged in?
    if (!memberAccess) {
      where.memberOnly = false
    }

    if (upcoming) {
      where.startDate = { gte: new Date() }
    }

    if (type) {
      where.type = type
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { startDate: upcoming ? 'asc' : 'desc' },
        include: {
          _count: { select: { rsvps: true } },
          rsvps: {
            where: memberAccess ? { houseMembershipId: memberAccess.id } : undefined,
            select: { id: true, status: true, guestsCount: true }
          },
          tickets: {
            where: { status: 'ACTIVE' },
            select: { id: true, name: true, price: true, currency: true }
          }
        }
      }),
      prisma.event.count({ where })
    ])

    const eventsWithUserRsvp = events.map(event => ({
      ...event,
      userRsvp: event.rsvps[0] || null,
      settings: event.settings || {}
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
    console.error('Events error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}