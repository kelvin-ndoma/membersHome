// app/api/portal/[houseSlug]/activities/route.ts
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

    const searchParams = req.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '30')
    const activityType = searchParams.get('type')

    const house = await prisma.house.findFirst({
      where: { slug: params.houseSlug }
    })

    if (!house) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

    const memberAccess = await prisma.houseMembership.findFirst({
      where: {
        houseId: house.id,
        membership: { userId: session.user.id },
        status: 'ACTIVE'
      }
    })

    if (!memberAccess) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 })
    }

    const where: any = {
      houseMembershipId: memberAccess.id
    }

    if (activityType) {
      where.activityType = activityType
    }

    const [activities, total] = await Promise.all([
      prisma.memberActivity.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { performedAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      }),
      prisma.memberActivity.count({ where })
    ])

    // Group activities by date
    const groupedActivities = activities.reduce((acc: any, activity) => {
      const date = new Date(activity.performedAt).toLocaleDateString()
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(activity)
      return acc
    }, {})

    return NextResponse.json({
      activities: groupedActivities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Activities error:', error)
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

    const { activityType, entityId, entityType, metadata } = await req.json()

    const house = await prisma.house.findFirst({
      where: { slug: params.houseSlug }
    })

    if (!house) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

    const memberAccess = await prisma.houseMembership.findFirst({
      where: {
        houseId: house.id,
        membership: { userId: session.user.id },
        status: 'ACTIVE'
      },
      include: {
        memberDashboard: true
      }
    })

    if (!memberAccess) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 })
    }

    const activity = await prisma.memberActivity.create({
      data: {
        houseMembershipId: memberAccess.id,
        dashboardId: memberAccess.memberDashboard?.id || memberAccess.id,
        userId: session.user.id,
        activityType,
        entityId: entityId || '',
        entityType: entityType || 'SYSTEM',
        metadata: metadata || {},
        performedAt: new Date(),
        ipAddress: req.headers.get('x-forwarded-for') || undefined,
        userAgent: req.headers.get('user-agent') || undefined
      }
    })

    return NextResponse.json({ success: true, activity }, { status: 201 })
  } catch (error) {
    console.error('Create activity error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}