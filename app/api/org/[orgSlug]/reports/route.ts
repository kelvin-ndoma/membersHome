// app/api/org/[orgSlug]/reports/route.ts
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

    const searchParams = req.nextUrl.searchParams
    const type = searchParams.get('type')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

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

    // Check if user is org admin
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

    const dateFilter: any = {}
    if (startDate) dateFilter.gte = new Date(startDate)
    if (endDate) dateFilter.lte = new Date(endDate)

    // Generate report based on type
    let reportData: any = {}

    if (!type || type === 'membership') {
      const [totalMembers, activeMembers, newMembers, membersByHouse] = await Promise.all([
        prisma.membership.count({ where: { organizationId: organization.id } }),
        prisma.membership.count({ where: { organizationId: organization.id, status: 'ACTIVE' } }),
        prisma.membership.count({
          where: {
            organizationId: organization.id,
            createdAt: dateFilter
          }
        }),
        prisma.house.findMany({
          where: { organizationId: organization.id },
          select: {
            name: true,
            _count: { select: { members: true } }
          }
        })
      ])

      reportData.membership = {
        totalMembers,
        activeMembers,
        newMembers,
        membersByHouse,
        retentionRate: totalMembers > 0 ? (activeMembers / totalMembers) * 100 : 0
      }
    }

    if (!type || type === 'revenue') {
      const payments = await prisma.payment.aggregate({
        where: {
          organizationId: organization.id,
          status: 'SUCCEEDED',
          createdAt: dateFilter
        },
        _sum: { amount: true },
        _count: true
      })

      // Get monthly revenue using groupBy instead of $queryRaw
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

      const recentPayments = await prisma.payment.findMany({
        where: {
          organizationId: organization.id,
          status: 'SUCCEEDED',
          createdAt: { gte: sixMonthsAgo }
        },
        select: {
          amount: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      })

      // Group by month manually
      const paymentsByMonth: Record<string, number> = {}
      recentPayments.forEach(payment => {
        const month = payment.createdAt.toISOString().slice(0, 7) // YYYY-MM
        paymentsByMonth[month] = (paymentsByMonth[month] || 0) + payment.amount
      })

      const monthlyArray = Object.entries(paymentsByMonth)
        .map(([month, total]) => ({ month, total }))
        .sort((a, b) => b.month.localeCompare(a.month))
        .slice(0, 12)

      reportData.revenue = {
        totalRevenue: payments._sum.amount || 0,
        totalTransactions: payments._count,
        averageTransaction: payments._count > 0 ? (payments._sum.amount || 0) / payments._count : 0,
        paymentsByMonth: monthlyArray
      }
    }

    if (!type || type === 'events') {
      const [totalEvents, upcomingEvents, pastEvents, eventsByHouse] = await Promise.all([
        prisma.event.count({ where: { organizationId: organization.id } }),
        prisma.event.count({
          where: {
            organizationId: organization.id,
            startDate: { gte: new Date() }
          }
        }),
        prisma.event.count({
          where: {
            organizationId: organization.id,
            startDate: { lt: new Date() }
          }
        }),
        prisma.house.findMany({
          where: { organizationId: organization.id },
          select: {
            name: true,
            _count: { select: { events: true } }
          }
        })
      ])

      const attendanceStats = await prisma.rSVP.aggregate({
        where: {
          organizationId: organization.id,
          status: 'ATTENDED'
        },
        _count: true
      })

      reportData.events = {
        totalEvents,
        upcomingEvents,
        pastEvents,
        eventsByHouse,
        totalAttendees: attendanceStats._count
      }
    }

    if (!type || type === 'engagement') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      
      const [activeMembers, messagesSent, eventRsvps] = await Promise.all([
        prisma.membership.count({
          where: {
            organizationId: organization.id,
            lastActiveAt: { gte: thirtyDaysAgo }
          }
        }),
        prisma.memberMessage.count({
          where: {
            organizationId: organization.id,
            createdAt: { gte: thirtyDaysAgo }
          }
        }),
        prisma.rSVP.count({
          where: {
            organizationId: organization.id,
            createdAt: { gte: thirtyDaysAgo }
          }
        })
      ])

      reportData.engagement = {
        activeMembersLast30Days: activeMembers,
        messagesLast30Days: messagesSent,
        rsvpsLast30Days: eventRsvps,
        engagementScore: activeMembers > 0 ? 
          ((messagesSent + eventRsvps) / activeMembers) * 100 : 0
      }
    }

    // Save report
    const report = await prisma.report.create({
      data: {
        type: (type || 'MEMBERSHIP_GROWTH') as any,
        title: `${type || 'Full'} Report - ${new Date().toLocaleDateString()}`,
        parameters: { startDate, endDate, type },
        data: reportData,
        organizationId: organization.id,
        generatedBy: session.user.id,
        accessLevel: 'ORGANIZATION'
      }
    })

    return NextResponse.json({
      report: {
        id: report.id,
        type: report.type,
        generatedAt: report.generatedAt,
        data: reportData
      }
    })
  } catch (error) {
    console.error('Generate report error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}