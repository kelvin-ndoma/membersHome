// app/api/org/[orgSlug]/dashboard/route.ts
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
      select: { id: true, name: true }
    })

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Check user membership and role
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organizationId: organization.id,
        role: { in: ['ORG_OWNER', 'ORG_ADMIN'] }
      }
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    // Get dashboard stats
    const [
      totalMembers,
      totalHouses,
      totalEvents,
      totalRevenue,
      recentMembers,
      recentEvents,
      upcomingEvents,
    ] = await Promise.all([
      prisma.membership.count({
        where: { organizationId: organization.id }
      }),
      prisma.house.count({
        where: { organizationId: organization.id }
      }),
      prisma.event.count({
        where: { organizationId: organization.id }
      }),
      prisma.payment.aggregate({
        where: {
          organizationId: organization.id,
          status: 'SUCCEEDED',
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        },
        _sum: { amount: true }
      }),
      prisma.membership.findMany({
        where: { organizationId: organization.id },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true }
          }
        }
      }),
      prisma.event.findMany({
        where: { organizationId: organization.id },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { rsvps: true } }
        }
      }),
      prisma.event.findMany({
        where: {
          organizationId: organization.id,
          startDate: { gte: new Date() }
        },
        take: 5,
        orderBy: { startDate: 'asc' },
      })
    ])

    return NextResponse.json({
      stats: {
        totalMembers,
        totalHouses,
        totalEvents,
        monthlyRevenue: totalRevenue._sum.amount || 0,
        memberGrowth: '+12%', // Calculate properly in production
        eventGrowth: '+8%',
      },
      recentMembers,
      recentEvents,
      upcomingEvents,
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}