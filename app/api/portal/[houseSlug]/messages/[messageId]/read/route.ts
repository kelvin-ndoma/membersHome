// app/api/portal/[houseSlug]/messages/[messageId]/read/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: { houseSlug: string; messageId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { houseSlug, messageId } = await Promise.resolve(params)

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
      return NextResponse.json({ error: 'Not a member' }, { status: 403 })
    }

    const message = await prisma.memberMessage.findFirst({
      where: {
        id: messageId,
        houseId: targetHouse.id,
        toHouseMembershipId: memberAccess.id
      }
    })

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    const updatedMessage = await prisma.memberMessage.update({
      where: { id: message.id },
      data: {
        isRead: true,
        readAt: new Date(),
        status: 'READ'
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mark read error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}