// app/api/platform/users/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.platformRole !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      include: {
        memberships: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
                status: true
              }
            },
            houseMemberships: {
              include: {
                house: {
                  select: {
                    id: true,
                    name: true,
                    slug: true
                  }
                }
              }
            }
          }
        },
        payments: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        auditLogs: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Remove sensitive data
    const { passwordHash, mfaSecret, ...safeUser } = user

    return NextResponse.json({ user: safeUser })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.platformRole !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updates = await req.json()

    const user = await prisma.user.update({
      where: { id: params.userId },
      data: updates
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: 'USER_UPDATED',
        entityType: 'USER',
        entityId: user.id,
        metadata: { updates }
      }
    })

    const { passwordHash, mfaSecret, ...safeUser } = user

    return NextResponse.json({ user: safeUser })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}