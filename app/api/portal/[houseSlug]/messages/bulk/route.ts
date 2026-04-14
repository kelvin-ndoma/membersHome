// app/api/portal/[houseSlug]/messages/bulk/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { houseSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { houseSlug } = await Promise.resolve(params)
    const { messageIds, status, isRead } = await req.json()

    if (!messageIds || !messageIds.length) {
      return NextResponse.json({ error: 'No messages selected' }, { status: 400 })
    }

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

    // Verify all messages belong to this user
    const messages = await prisma.memberMessage.findMany({
      where: {
        id: { in: messageIds },
        houseId: targetHouse.id,
        OR: [
          { toHouseMembershipId: memberAccess.id },
          { fromHouseMembershipId: memberAccess.id }
        ]
      }
    })

    if (messages.length !== messageIds.length) {
      return NextResponse.json({ error: 'Some messages not found' }, { status: 404 })
    }

    // Update messages
    const updateData: any = {}
    if (status) updateData.status = status
    if (isRead !== undefined) updateData.isRead = isRead

    await prisma.memberMessage.updateMany({
      where: { id: { in: messageIds } },
      data: updateData
    })

    return NextResponse.json({ success: true, count: messageIds.length })
  } catch (error) {
    console.error('Bulk update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}