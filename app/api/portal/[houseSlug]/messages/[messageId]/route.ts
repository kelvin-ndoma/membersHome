// app/api/portal/[houseSlug]/messages/[messageId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

export async function GET(
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
        OR: [
          { fromHouseMembershipId: memberAccess.id },
          { toHouseMembershipId: memberAccess.id }
        ]
      },
      include: {
        fromHouseMembership: {
          include: {
            membership: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, image: true }
                }
              }
            }
          }
        },
        toHouseMembership: {
          include: {
            membership: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, image: true }
                }
              }
            }
          }
        },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            fromHouseMembership: {
              include: {
                membership: {
                  include: {
                    user: { select: { id: true, name: true, image: true } }
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      message: {
        ...message,
        currentUserId: session.user.id
      }
    })
  } catch (error) {
    console.error('Get message error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { houseSlug: string; messageId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { houseSlug, messageId } = await Promise.resolve(params)
    const { status, isRead } = await req.json()

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

    const updateData: any = {}
    if (status) updateData.status = status
    if (isRead !== undefined) updateData.isRead = isRead

    const updatedMessage = await prisma.memberMessage.update({
      where: { id: message.id },
      data: updateData
    })

    return NextResponse.json({ success: true, message: updatedMessage })
  } catch (error) {
    console.error('Update message error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}