// app/api/portal/[houseSlug]/dashboard/route.ts
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

    const house = await prisma.house.findFirst({
      where: { slug: params.houseSlug },
      include: {
        organization: {
          select: { id: true, name: true, slug: true, primaryColor: true }
        },
        memberPortal: true,
        members: {
          where: {
            membership: { userId: session.user.id },
            status: 'ACTIVE'
          },
          include: {
            memberDashboard: true
          }
        }
      }
    })

    if (!house) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

    const memberAccess = house.members[0]
    if (!memberAccess) {
      return NextResponse.json({ error: 'Not a member of this house' }, { status: 403 })
    }

    const [upcomingEvents, recentAnnouncements, memberCount, userRsvps] = await Promise.all([
      prisma.event.findMany({
        where: {
          OR: [
            { houseId: house.id },
            { organizationId: house.organizationId, houseId: null }
          ],
          status: 'PUBLISHED',
          startDate: { gte: new Date() }
        },
        orderBy: { startDate: 'asc' },
        take: 5,
        include: {
          _count: { select: { rsvps: true } }
        }
      }),
      prisma.communication.findMany({
        where: {
          OR: [
            { houseId: house.id },
            { organizationId: house.organizationId, houseId: null }
          ],
          status: 'SENT',
          type: 'ANNOUNCEMENT'
        },
        orderBy: { sentAt: 'desc' },
        take: 3
      }),
      prisma.houseMembership.count({
        where: { houseId: house.id, status: 'ACTIVE' }
      }),
      prisma.rSVP.findMany({
        where: {
          houseMembershipId: memberAccess.id,
          event: { startDate: { gte: new Date() } }
        },
        include: {
          event: {
            select: { id: true, title: true, startDate: true, location: true }
          }
        },
        orderBy: { event: { startDate: 'asc' } },
        take: 3
      })
    ])

    await prisma.houseMembership.update({
      where: { id: memberAccess.id },
      data: { lastActiveAt: new Date() }
    })

    return NextResponse.json({
      house: {
        id: house.id,
        name: house.name,
        slug: house.slug,
        description: house.description,
        organization: house.organization,
        memberPortal: house.memberPortal
      },
      member: {
        id: memberAccess.id,
        role: memberAccess.role,
        joinedAt: memberAccess.joinedAt,
        dashboard: memberAccess.memberDashboard
      },
      stats: {
        totalMembers: memberCount,
        myRsvps: userRsvps.length,
        upcomingEvents: upcomingEvents.length
      },
      upcomingEvents,
      recentAnnouncements,
      myUpcomingRsvps: userRsvps
    })
  } catch (error) {
    console.error('Portal dashboard error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}