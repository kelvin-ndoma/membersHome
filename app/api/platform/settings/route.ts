// app/api/platform/settings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.platformRole !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let platform = await prisma.platform.findFirst()
    
    if (!platform) {
      platform = await prisma.platform.create({
        data: {
          name: 'MembersHome',
          settings: {}
        }
      })
    }

    return NextResponse.json({ platform })
  } catch (error) {
    console.error('Get settings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.platformRole !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updates = await req.json()

    let platform = await prisma.platform.findFirst()
    
    if (!platform) {
      platform = await prisma.platform.create({
        data: {
          name: 'MembersHome',
          ...updates
        }
      })
    } else {
      platform = await prisma.platform.update({
        where: { id: platform.id },
        data: updates
      })
    }

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: 'PLATFORM_SETTINGS_UPDATED',
        entityType: 'PLATFORM',
        entityId: platform.id,
        metadata: { updates }
      }
    })

    return NextResponse.json({ platform })
  } catch (error) {
    console.error('Update settings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}