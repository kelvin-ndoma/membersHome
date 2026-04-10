// app/api/org/[orgSlug]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { orgSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organization = await prisma.organization.findUnique({
      where: { slug: params.orgSlug },
      include: {
        _count: {
          select: {
            memberships: true,
            houses: true,
            events: true,
          }
        },
        memberships: {
          where: { userId: session.user.id },
          select: {
            id: true,
            role: true,
            status: true,
          }
        }
      }
    })

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Check if user is a member
    const userMembership = organization.memberships[0]
    if (!userMembership) {
      return NextResponse.json(
        { error: 'You are not a member of this organization' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      organization: {
        ...organization,
        userRole: userMembership.role,
      }
    })
  } catch (error) {
    console.error('Get organization error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}