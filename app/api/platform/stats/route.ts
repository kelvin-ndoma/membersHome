// app/api/platform/stats/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.platformRole !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [
      totalOrgs,
      activeOrgs,
      totalUsers,
      totalHouses,
      recentOrgs,
      revenueStats
    ] = await Promise.all([
      prisma.organization.count(),
      prisma.organization.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count(),
      prisma.house.count(),
      prisma.organization.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { memberships: true } }
        }
      }),
      prisma.payment.aggregate({
        where: {
          status: 'SUCCEEDED',
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        },
        _sum: { amount: true }
      })
    ])

    return NextResponse.json({
      totalOrganizations: totalOrgs,
      activeOrganizations: activeOrgs,
      totalUsers,
      totalHouses,
      recentOrganizations: recentOrgs,
      monthlyRevenue: revenueStats._sum.amount || 0
    })
  } catch (error) {
    console.error('Platform stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}