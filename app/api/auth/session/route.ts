// app/api/auth/session/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { user: null },
        { status: 200 }
      )
    }

    // Fetch full user data with memberships
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        platformRole: true,
        emailVerified: true,
        lastLoginAt: true,
        memberships: {
          where: { status: 'ACTIVE' },
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            houseMemberships: {
              where: { status: 'ACTIVE' },
              include: {
                house: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}