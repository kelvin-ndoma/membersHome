// app/api/portal/[houseSlug]/tickets/[ticketId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { houseSlug: string; ticketId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { houseSlug, ticketId } = params

    // Find house through user's memberships
    const userMemberships = await prisma.membership.findMany({
      where: {
        userId: session.user.id,
        status: 'ACTIVE'
      },
      include: {
        houseMemberships: {
          where: {
            status: 'ACTIVE',
            house: { slug: houseSlug }
          },
          include: { house: true }
        }
      }
    })

    let targetHouse = null
    for (const membership of userMemberships) {
      const hm = membership.houseMemberships[0]
      if (hm) {
        targetHouse = hm.house
        break
      }
    }

    if (!targetHouse) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        OR: [
          { houseId: targetHouse.id },
          { organizationId: targetHouse.organizationId, houseId: null }
        ],
        status: 'ACTIVE'
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            location: true,
            imageUrl: true,
          }
        }
      }
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    return NextResponse.json({
      ticket,
      event: ticket.event,
      house: targetHouse
    })
  } catch (error) {
    console.error('Get ticket error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}