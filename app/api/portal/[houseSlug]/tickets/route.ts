// app/api/portal/[houseSlug]/tickets/route.ts
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
      where: { slug: params.houseSlug }
    })

    if (!house) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

    const memberAccess = await prisma.houseMembership.findFirst({
      where: {
        houseId: house.id,
        membership: { userId: session.user.id },
        status: 'ACTIVE'
      }
    })

    if (!memberAccess) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 })
    }

    const purchases = await prisma.ticketPurchase.findMany({
      where: {
        OR: [
          { userId: session.user.id },
          { houseMembershipId: memberAccess.id }
        ]
      },
      include: {
        ticket: {
          include: {
            event: {
              select: { id: true, title: true, startDate: true, location: true }
            }
          }
        },
        validations: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ purchases })
  } catch (error) {
    console.error('Tickets error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}