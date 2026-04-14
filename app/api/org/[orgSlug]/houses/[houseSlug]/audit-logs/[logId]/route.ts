// app/api/org/[orgSlug]/houses/[houseSlug]/audit-logs/[logId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string; logId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const house = await prisma.house.findFirst({
      where: {
        slug: params.houseSlug,
        organization: { slug: params.orgSlug }
      },
      select: { id: true, organizationId: true }
    })

    if (!house) {
      return NextResponse.json(
        { error: 'House not found' },
        { status: 404 }
      )
    }

    // Check access
    const hasAccess = await prisma.houseMembership.findFirst({
      where: {
        houseId: house.id,
        membership: { userId: session.user.id },
        status: 'ACTIVE'
      }
    })

    const isOrgAdmin = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organizationId: house.organizationId,
        role: { in: ['ORG_OWNER', 'ORG_ADMIN'] }
      }
    })

    if (!hasAccess && !isOrgAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Access denied' },
        { status: 403 }
      )
    }

    const log = await prisma.auditLog.findFirst({
      where: {
        id: params.logId,
        houseId: house.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        house: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        },
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        }
      }
    })

    if (!log) {
      return NextResponse.json(
        { error: 'Audit log not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ log })
  } catch (error) {
    console.error('Get audit log detail error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}