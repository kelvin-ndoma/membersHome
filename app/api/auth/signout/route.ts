// app/api/auth/signout/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (session?.user?.id) {
      // Log the signout
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          userEmail: session.user.email,
          action: 'SIGNOUT',
          entityType: 'USER',
          entityId: session.user.id,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Signout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}