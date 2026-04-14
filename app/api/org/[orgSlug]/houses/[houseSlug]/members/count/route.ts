// app/api/org/[orgSlug]/houses/[houseSlug]/members/count/route.ts
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
    const type = searchParams.get('type') || 'ALL_MEMBERS'

    const house = await prisma.house.findFirst({
      where: {
        slug: params.houseSlug,
        organization: { slug: params.orgSlug }
      }
    })

    if (!house) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

    let count = 0

    if (type === 'ALL_MEMBERS' || type === 'HOUSE_MEMBERS') {
      count = await prisma.houseMembership.count({
        where: {
          houseId: house.id,
          status: 'ACTIVE'
        }
      })
    } else if (type === 'EVENT_ATTENDEES') {
      // Count members who have attended events
      count = await prisma.houseMembership.count({
        where: {
          houseId: house.id,
          status: 'ACTIVE',
          rsvps: {
            some: {
              status: 'ATTENDED'
            }
          }
        }
      })
    } else if (type === 'TICKET_BUYERS') {
      // Count members who have purchased tickets
      count = await prisma.houseMembership.count({
        where: {
          houseId: house.id,
          status: 'ACTIVE',
          ticketPurchases: {
            some: {
              paymentStatus: 'SUCCEEDED'
            }
          }
        }
      })
    }

    return NextResponse.json({ count })
  } catch (error) {
    console.error('Member count error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}