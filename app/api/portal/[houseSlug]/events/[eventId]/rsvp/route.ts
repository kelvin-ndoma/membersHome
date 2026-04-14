// app/api/portal/[houseSlug]/events/[eventId]/rsvp/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: { houseSlug: string; eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { status, guestsCount = 0, notes } = await req.json()

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
          include: { 
            house: true,
            memberDashboard: true
          }
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

    // At this point, if targetHouse exists, memberAccess must exist
    // because we found it through the user's house membership
    if (!memberAccess) {
      return NextResponse.json({ error: 'Not a member of this house' }, { status: 403 })
    }

    const event = await prisma.event.findFirst({
      where: {
        id: params.eventId,
        OR: [
          { houseId: targetHouse.id },
          { organizationId: targetHouse.organizationId, houseId: null }
        ],
        status: 'PUBLISHED'
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

    if (rsvpSettings.enabled === false) {
      return NextResponse.json({ error: 'RSVP is not enabled for this event' }, { status: 400 })
    }

    // Check RSVP deadline
    if (rsvpSettings.deadline && new Date(rsvpSettings.deadline) < new Date()) {
      return NextResponse.json({ error: 'RSVP deadline has passed' }, { status: 400 })
    }

    // Check if event is in the past
    if (new Date(event.endDate) < new Date()) {
      return NextResponse.json({ error: 'Cannot RSVP to past events' }, { status: 400 })
    }

    // Check guest limit
    const maxGuests = rsvpSettings.maxGuestsPerRsvp || 1
    if (guestsCount > maxGuests) {
      return NextResponse.json({ 
        error: `Maximum ${maxGuests} guest${maxGuests !== 1 ? 's' : ''} allowed per RSVP` 
      }, { status: 400 })
    }

    // Check capacity
    if (event.capacity) {
      const currentRsvps = await prisma.rSVP.count({
        where: { 
          eventId: event.id, 
          status: { in: ['CONFIRMED', 'ATTENDED'] } 
        }
      })
      
      if (currentRsvps + guestsCount + 1 > event.capacity) {
        return NextResponse.json({ error: 'Event is full' }, { status: 400 })
      }
    }

    const finalStatus = rsvpSettings.requireApproval ? 'PENDING' : (status || 'CONFIRMED')

    // Now TypeScript knows memberAccess is not null
    const rsvp = await prisma.rSVP.upsert({
      where: {
        eventId_houseMembershipId: {
          eventId: event.id,
          houseMembershipId: memberAccess.id
        }
      },
      update: {
        status: finalStatus,
        guestsCount,
        notes,
        updatedAt: new Date()
      },
      create: {
        eventId: event.id,
        houseMembershipId: memberAccess.id,
        organizationId: event.organizationId,
        houseId: event.houseId,
        status: finalStatus,
        guestsCount,
        notes
      }
    })

    // Log activity
    if (memberAccess.memberDashboard) {
      await prisma.memberActivity.create({
        data: {
          houseMembershipId: memberAccess.id,
          dashboardId: memberAccess.memberDashboard.id,
          userId: session.user.id,
          activityType: 'EVENT_RSVP',
          entityId: event.id,
          entityType: 'EVENT',
          performedAt: new Date(),
          metadata: { status: finalStatus, guestsCount }
        }
      })
    }

    return NextResponse.json({ 
      success: true, 
      rsvp,
      message: rsvpSettings.requireApproval 
        ? 'RSVP submitted for approval' 
        : 'RSVP confirmed!'
    })
  } catch (error) {
    console.error('RSVP error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
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

    if (!memberAccess) {
      return NextResponse.json({ error: 'Not a member of this house' }, { status: 403 })
    }

    const event = await prisma.event.findFirst({
      where: {
        id: params.eventId,
        OR: [
          { houseId: targetHouse.id },
          { organizationId: targetHouse.organizationId, houseId: null }
        ]
      }
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Check if event is in the past
    if (new Date(event.endDate) < new Date()) {
      return NextResponse.json({ error: 'Cannot modify RSVP for past events' }, { status: 400 })
    }

    await prisma.rSVP.update({
      where: {
        eventId_houseMembershipId: {
          eventId: event.id,
          houseMembershipId: memberAccess.id
        }
      },
      data: { status: 'CANCELLED' }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cancel RSVP error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}