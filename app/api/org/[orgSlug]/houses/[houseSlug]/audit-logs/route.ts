// app/api/org/[orgSlug]/houses/[houseSlug]/audit-logs/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const action = searchParams.get('action')
    const entityType = searchParams.get('entityType')
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

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

    // Check if user has access (house member or org admin)
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

    // Build where clause
    const where: any = {
      houseId: house.id
    }

    if (action) where.action = action
    if (entityType) where.entityType = entityType
    if (userId) where.userId = userId
    
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
          }
        }
      }),
      prisma.auditLog.count({ where })
    ])

    // Get unique actions for filters
    const uniqueActions = await prisma.auditLog.findMany({
      where: { houseId: house.id },
      select: { action: true },
      distinct: ['action'],
      orderBy: { action: 'asc' }
    })

    // Get unique entity types for filters
    const uniqueEntityTypes = await prisma.auditLog.findMany({
      where: { houseId: house.id },
      select: { entityType: true },
      distinct: ['entityType'],
      orderBy: { entityType: 'asc' }
    })

    // Get users who performed actions
    const uniqueUsers = await prisma.auditLog.findMany({
      where: { 
        houseId: house.id,
        userId: { not: null }
      },
      select: {
        userId: true,
        user: {
          select: {
            name: true,
            email: true,
          }
        }
      },
      distinct: ['userId'],
      orderBy: { user: { name: 'asc' } }
    })

    return NextResponse.json({
      logs,
      filters: {
        actions: uniqueActions.map(a => a.action),
        entityTypes: uniqueEntityTypes.map(e => e.entityType),
        users: uniqueUsers.map(u => ({
          id: u.userId!,
          name: u.user?.name || u.user?.email || 'Unknown'
        }))
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get audit logs error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}