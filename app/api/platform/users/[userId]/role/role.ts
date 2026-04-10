// app/api/platform/users/[userId]/role/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'
import { PlatformRole } from '@prisma/client'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.platformRole !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { role } = await req.json()

    if (!role || !['USER', 'PLATFORM_ADMIN'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Prevent removing the last platform admin
    if (role === 'USER') {
      const adminCount = await prisma.user.count({
        where: { platformRole: 'PLATFORM_ADMIN' }
      })
      
      if (adminCount <= 1) {
        const user = await prisma.user.findUnique({
          where: { id: params.userId },
          select: { platformRole: true }
        })
        
        if (user?.platformRole === 'PLATFORM_ADMIN') {
          return NextResponse.json(
            { error: 'Cannot remove the last platform admin' },
            { status: 400 }
          )
        }
      }
    }

    const user = await prisma.user.update({
      where: { id: params.userId },
      data: { platformRole: role as PlatformRole }
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: 'USER_ROLE_CHANGED',
        entityType: 'USER',
        entityId: user.id,
        metadata: {
          previousRole: user.platformRole,
          newRole: role
        }
      }
    })

    return NextResponse.json({
      success: true,
      role: user.platformRole
    })
  } catch (error) {
    console.error('Update user role error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}