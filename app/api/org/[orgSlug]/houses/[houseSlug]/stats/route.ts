// app/api/org/[orgSlug]/houses/[houseSlug]/stats/route.ts
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

    const house = await prisma.house.findFirst({
      where: {
        slug: params.houseSlug,
        organization: { slug: params.orgSlug }
      },
      select: { id: true, name: true, organizationId: true }
    })

    if (!house) {
      return NextResponse.json(
        { error: 'House not found' },
        { status: 404 }
      )
    }

    const [
      totalMembers,
      activeMembers,
      totalEvents,
      upcomingEvents,
      memberGrowth,
    ] = await Promise.all([
      prisma.houseMembership.count({ where: { houseId: house.id } }),
      prisma.houseMembership.count({ 
        where: { houseId: house.id, status: 'ACTIVE' } 
      }),
      prisma.event.count({ where: { houseId: house.id } }),
      prisma.event.count({
        where: {
          houseId: house.id,
          startDate: { gte: new Date() }
        }
      }),
      prisma.houseMembership.count({
        where: {
          houseId: house.id,
          joinedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      }),
    ])

    return NextResponse.json({
      stats: {
        totalMembers,
        activeMembers,
        totalEvents,
        upcomingEvents,
        memberGrowth,
        engagement: '78%', // Calculate properly
      }
    })
  } catch (error) {
    console.error('House stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}