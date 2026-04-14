// app/api/portal/[houseSlug]/events/[eventId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { houseSlug: string; eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

    const event = await prisma.event.findFirst({
      where: {
        id: params.eventId,
        OR: [
          { houseId: targetHouse.id },
          { organizationId: targetHouse.organizationId, houseId: null }
        ],
        status: 'PUBLISHED'
      },
      include: {
        _count: { select: { rsvps: true } },
        rsvps: {
          where: memberAccess ? { houseMembershipId: memberAccess.id } : undefined,
          select: { id: true, status: true, guestsCount: true, checkedInAt: true }
        },
        tickets: {
          where: { status: 'ACTIVE' },
          include: {
            _count: { select: { purchases: true } }
          }
        },
        creator: {
          select: { name: true }
        },
        house: {
          select: { name: true, slug: true }
        },
        organization: {
          select: { name: true, slug: true }
        }
      }
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Check member-only access
    if (event.memberOnly && !memberAccess) {
      return NextResponse.json({ error: 'This event is for members only' }, { status: 403 })
    }

    // Check RSVP settings
    const settings = (event.settings as any) || {}
    const rsvpSettings = settings.rsvp || {}
    const ticketSettings = settings.tickets || {}

    // Check if RSVP is still open
    const rsvpOpen = rsvpSettings.enabled !== false && (
      !rsvpSettings.deadline || new Date(rsvpSettings.deadline) > new Date()
    )

    // Check if event is in the past
    const isPast = new Date(event.endDate) < new Date()

    return NextResponse.json({
      event: {
        ...event,
        userRsvp: event.rsvps[0] || null,
        settings: settings,
        _meta: {
          rsvpOpen,
          isPast,
          canRsvp: rsvpOpen && !isPast && (!event.memberOnly || !!memberAccess),
          canPurchaseTickets: ticketSettings.allowPurchases !== false && !isPast,
        }
      }
    })
  } catch (error) {
    console.error('Event error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}