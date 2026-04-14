// app/api/portal/[houseSlug]/messages/route.ts
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
    const searchParams = req.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const folder = searchParams.get('folder') || 'inbox'
    const search = searchParams.get('search') || ''

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
      return NextResponse.json({ error: 'Not a member of this house' }, { status: 403 })
    }

    // Build where clause
    const where: any = {
      houseId: targetHouse.id,
      organizationId: targetHouse.organizationId,
    }

    if (folder === 'inbox') {
      where.toHouseMembershipId = memberAccess.id
      where.status = { not: 'DELETED' }
    } else if (folder === 'sent') {
      where.fromHouseMembershipId = memberAccess.id
      where.status = { not: 'DELETED' }
    } else if (folder === 'archived') {
      where.toHouseMembershipId = memberAccess.id
      where.status = 'DELETED'
    }

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [messages, total, unreadCount] = await Promise.all([
      prisma.memberMessage.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
          }
        }
      }),
      prisma.memberMessage.count({ where }),
      prisma.memberMessage.count({
        where: {
          toHouseMembershipId: memberAccess.id,
          isRead: false,
          status: { not: 'DELETED' }
        }
      })
    ])

    // Add currentMemberId to help frontend identify sent messages
    const messagesWithContext = messages.map(m => ({
      ...m,
      currentMemberId: memberAccess.id
    }))

    return NextResponse.json({
      messages: messagesWithContext,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Messages error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { houseSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { houseSlug } = await Promise.resolve(params)
    const { toMemberId, subject, message, parentMessageId } = await req.json()

    if (!toMemberId || !subject || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
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
    let fromMemberAccess = null

    for (const membership of userMemberships) {
      const hm = membership.houseMemberships[0]
      if (hm) {
        targetHouse = hm.house
        fromMemberAccess = hm
        break
      }
    }

    if (!targetHouse || !fromMemberAccess) {
      return NextResponse.json({ error: 'Not a member of this house' }, { status: 403 })
    }

    // Get recipient
    const toMember = await prisma.houseMembership.findUnique({
      where: { id: toMemberId },
      include: {
        membership: {
          include: {
            user: true
          }
        }
      }
    })

    if (!toMember || toMember.houseId !== targetHouse.id) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 })
    }

    // Create message
    const newMessage = await prisma.memberMessage.create({
      data: {
        fromHouseMembershipId: fromMemberAccess.id,
        toHouseMembershipId: toMember.id,
        fromUserId: session.user.id,
        toUserId: toMember.membership.userId,
        houseId: targetHouse.id,
        organizationId: targetHouse.organizationId,
        subject,
        message,
        parentMessageId: parentMessageId || null,
        status: 'SENT'
      },
      include: {
        fromHouseMembership: {
          include: {
            membership: {
              include: {
                user: {
                  select: { id: true, name: true, email: true }
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
                  select: { id: true, name: true, email: true }
                }
              }
            }
          }
        }
      }
    })

    return NextResponse.json({ success: true, message: newMessage }, { status: 201 })
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}