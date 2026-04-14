// app/api/portal/[houseSlug]/messages/unread/route.ts
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

    const { houseSlug } = await Promise.resolve(params)

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
    let memberAccess = null

    for (const membership of userMemberships) {
      const hm = membership.houseMemberships[0]
      if (hm) {
        targetHouse = hm.house
        memberAccess = hm
        break
      }
    }

    if (!targetHouse || !memberAccess) {
      return NextResponse.json({ count: 0 })
    }

    const count = await prisma.memberMessage.count({
      where: {
        houseId: targetHouse.id,
        toHouseMembershipId: memberAccess.id,
        isRead: false,
        status: { not: 'DELETED' }
      }
    })

    return NextResponse.json({ count })
  } catch (error) {
    console.error('Unread count error:', error)
    return NextResponse.json({ count: 0 })
  }
}