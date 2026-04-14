// app/api/org/[orgSlug]/houses/[houseSlug]/reports/route.ts
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
    const type = searchParams.get('type')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const house = await prisma.house.findFirst({
      where: {
        slug: params.houseSlug,
        organization: { slug: params.orgSlug }
      },
      include: {
        organization: {
          select: { id: true, name: true, primaryColor: true }
        }
      }
    })

    if (!house) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

    // Check if user has access (org admin or house staff)
    const memberAccess = await prisma.houseMembership.findFirst({
      where: {
        houseId: house.id,
        membership: { userId: session.user.id },
        status: 'ACTIVE',
        role: { in: ['HOUSE_MANAGER', 'HOUSE_ADMIN', 'HOUSE_STAFF'] }
      }
    })

    const isOrgAdmin = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organizationId: house.organizationId,
        role: { in: ['ORG_OWNER', 'ORG_ADMIN'] },
        status: 'ACTIVE'
      }
    })

    if (!memberAccess && !isOrgAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const where: any = {
      OR: [
        { houseId: house.id },
        { organizationId: house.organizationId, houseId: null }
      ]
    }

    if (type) {
      where.type = type
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { generatedAt: 'desc' },
        include: {
          generator: {
            select: { id: true, name: true, email: true }
          }
        }
      }),
      prisma.report.count({ where })
    ])

    // Get available report types with counts
    const typeCounts = await prisma.report.groupBy({
      by: ['type'],
      where: {
        OR: [
          { houseId: house.id },
          { organizationId: house.organizationId, houseId: null }
        ]
      },
      _count: true
    })

    return NextResponse.json({
      reports,
      typeCounts,
      house: {
        id: house.id,
        name: house.name,
        organization: house.organization
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get reports error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type, title, description, parameters } = await req.json()

    if (!type || !title) {
      return NextResponse.json(
        { error: 'Report type and title are required' },
        { status: 400 }
      )
    }

    const house = await prisma.house.findFirst({
      where: {
        slug: params.houseSlug,
        organization: { slug: params.orgSlug }
      },
      include: {
        organization: true
      }
    })

    if (!house) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

    // Generate report data based on type
    let reportData: any = {}
    const dateRange = parameters?.dateRange || 'last30days'
    
    let startDate = new Date()
    const endDate = new Date()
    
    switch (dateRange) {
      case 'today':
        startDate.setHours(0, 0, 0, 0)
        break
      case 'yesterday':
        startDate.setDate(startDate.getDate() - 1)
        startDate.setHours(0, 0, 0, 0)
        break
      case 'last7days':
        startDate.setDate(startDate.getDate() - 7)
        break
      case 'last30days':
        startDate.setDate(startDate.getDate() - 30)
        break
      case 'last90days':
        startDate.setDate(startDate.getDate() - 90)
        break
      case 'thisMonth':
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
        break
      case 'lastMonth':
        startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 1, 1)
        break
      case 'thisYear':
        startDate = new Date(endDate.getFullYear(), 0, 1)
        break
      case 'custom':
        if (parameters?.startDate) startDate = new Date(parameters.startDate)
        if (parameters?.endDate) startDate = new Date(parameters.startDate)
        break
    }

    const dateFilter = {
      gte: startDate,
      lte: endDate
    }

    // Generate data based on report type
    switch (type) {
      case 'MEMBERSHIP_GROWTH':
        const [totalMembers, newMembers, activeMembers, pausedMembers, cancelledMembers] = await Promise.all([
          prisma.houseMembership.count({ where: { houseId: house.id } }),
          prisma.houseMembership.count({ where: { houseId: house.id, joinedAt: dateFilter } }),
          prisma.houseMembership.count({ where: { houseId: house.id, status: 'ACTIVE' } }),
          prisma.houseMembership.count({ where: { houseId: house.id, status: 'PAUSED' } }),
          prisma.houseMembership.count({ where: { houseId: house.id, status: 'CANCELLED' } })
        ])

        // Get monthly growth by fetching all members and grouping manually
        const allMembers = await prisma.houseMembership.findMany({
          where: {
            houseId: house.id,
            joinedAt: { gte: startDate }
          },
          select: {
            joinedAt: true
          },
          orderBy: { joinedAt: 'asc' }
        })

        const monthlyGrowth: Record<string, number> = {}
        allMembers.forEach(member => {
          const month = member.joinedAt.toISOString().slice(0, 7)
          monthlyGrowth[month] = (monthlyGrowth[month] || 0) + 1
        })

        reportData = {
          totalMembers,
          newMembers,
          activeMembers,
          pausedMembers,
          cancelledMembers,
          retentionRate: totalMembers > 0 ? ((activeMembers / totalMembers) * 100).toFixed(1) : 0,
          churnRate: totalMembers > 0 ? ((cancelledMembers / totalMembers) * 100).toFixed(1) : 0,
          monthlyGrowth: Object.entries(monthlyGrowth).map(([month, count]) => ({ month, count })),
          dateRange: { startDate, endDate }
        }
        break

      case 'REVENUE_ANALYSIS':
        const payments = await prisma.payment.findMany({
          where: {
            houseId: house.id,
            status: 'SUCCEEDED',
            createdAt: dateFilter
          },
          include: {
            membershipItem: {
              include: {
                membershipPlan: true
              }
            }
          }
        })

        const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0)
        const averageTransaction = payments.length > 0 ? totalRevenue / payments.length : 0

        // Revenue by plan
        const revenueByPlan: Record<string, number> = {}
        payments.forEach(p => {
          const planName = p.membershipItem?.membershipPlan?.name || 'Other'
          revenueByPlan[planName] = (revenueByPlan[planName] || 0) + p.amount
        })

        // Monthly revenue
        const monthlyRevenue: Record<string, number> = {}
        payments.forEach(p => {
          const month = p.createdAt.toISOString().slice(0, 7)
          monthlyRevenue[month] = (monthlyRevenue[month] || 0) + p.amount
        })

        reportData = {
          totalRevenue,
          totalTransactions: payments.length,
          averageTransaction,
          revenueByPlan: Object.entries(revenueByPlan).map(([plan, amount]) => ({ plan, amount })),
          monthlyRevenue: Object.entries(monthlyRevenue).map(([month, amount]) => ({ month, amount })),
          dateRange: { startDate, endDate }
        }
        break

      case 'EVENT_ATTENDANCE':
        const events = await prisma.event.findMany({
          where: {
            OR: [
              { houseId: house.id },
              { organizationId: house.organizationId, houseId: null }
            ],
            startDate: dateFilter
          },
          include: {
            _count: { select: { rsvps: true } },
            rsvps: {
              where: { status: 'ATTENDED' }
            }
          },
          orderBy: { startDate: 'desc' }
        })

        const totalEvents = events.length
        const totalAttendees = events.reduce((sum, e) => sum + e.rsvps.length, 0)
        const totalRsvps = events.reduce((sum, e) => sum + e._count.rsvps, 0)
        const attendanceRate = totalRsvps > 0 ? ((totalAttendees / totalRsvps) * 100).toFixed(1) : 0

        reportData = {
          totalEvents,
          totalAttendees,
          totalRsvps,
          attendanceRate,
          events: events.map(e => ({
            id: e.id,
            title: e.title,
            startDate: e.startDate,
            rsvps: e._count.rsvps,
            attended: e.rsvps.length,
            rate: e._count.rsvps > 0 ? ((e.rsvps.length / e._count.rsvps) * 100).toFixed(1) : 0
          })),
          dateRange: { startDate, endDate }
        }
        break

      case 'TICKET_SALES':
        const ticketPurchases = await prisma.ticketPurchase.findMany({
          where: {
            houseId: house.id,
            createdAt: dateFilter
          },
          include: {
            ticket: {
              include: {
                event: { select: { title: true } }
              }
            }
          }
        })

        const totalTicketRevenue = ticketPurchases.reduce((sum, p) => sum + p.totalAmount, 0)
        const totalTicketsSold = ticketPurchases.reduce((sum, p) => sum + p.quantity, 0)

        // Sales by ticket type
        const salesByTicket: Record<string, { name: string; quantity: number; revenue: number }> = {}
        ticketPurchases.forEach(p => {
          const ticketName = p.ticket?.name || 'Unknown'
          if (!salesByTicket[ticketName]) {
            salesByTicket[ticketName] = { name: ticketName, quantity: 0, revenue: 0 }
          }
          salesByTicket[ticketName].quantity += p.quantity
          salesByTicket[ticketName].revenue += p.totalAmount
        })

        reportData = {
          totalTicketRevenue,
          totalTicketsSold,
          totalPurchases: ticketPurchases.length,
          averageTicketPrice: totalTicketsSold > 0 ? totalTicketRevenue / totalTicketsSold : 0,
          salesByTicket: Object.values(salesByTicket),
          dateRange: { startDate, endDate }
        }
        break

      case 'ENGAGEMENT_METRICS':
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        
        const [totalMembersForEngagement, activeMemberships] = await Promise.all([
          prisma.houseMembership.count({ where: { houseId: house.id } }),
          prisma.memberActivity.findMany({
            where: {
              houseMembership: { houseId: house.id },
              performedAt: { gte: thirtyDaysAgo }
            },
            select: {
              houseMembershipId: true
            },
            distinct: ['houseMembershipId']
          })
        ])

        const activeMembersLast30Days = activeMemberships.length

        const activityBreakdown = await prisma.memberActivity.groupBy({
          by: ['activityType'],
          where: {
            houseMembership: { houseId: house.id },
            performedAt: dateFilter
          },
          _count: true
        })

        const messagesSent = await prisma.memberMessage.count({
          where: {
            houseId: house.id,
            createdAt: dateFilter
          }
        })

        const portalLogins = await prisma.memberDashboard.count({
          where: {
            houseId: house.id,
            lastPortalLoginAt: dateFilter
          }
        })

        reportData = {
          totalMembers: totalMembersForEngagement,
          activeMembersLast30Days,
          engagementRate: totalMembersForEngagement > 0 ? ((activeMembersLast30Days / totalMembersForEngagement) * 100).toFixed(1) : 0,
          activityBreakdown: activityBreakdown.map(a => ({
            type: a.activityType,
            count: a._count
          })),
          messagesSent,
          portalLogins,
          dateRange: { startDate, endDate }
        }
        break

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }

    // Save the report
    const report = await prisma.report.create({
      data: {
        type: type as any,
        title,
        description,
        parameters: { ...parameters, dateRange, startDate, endDate },
        data: reportData,
        organizationId: house.organizationId,
        houseId: house.id,
        generatedBy: session.user.id,
        accessLevel: 'HOUSE_ONLY'
      }
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email || '',
        action: 'REPORT_GENERATED',
        entityType: 'REPORT',
        entityId: report.id,
        organizationId: house.organizationId,
        houseId: house.id,
        metadata: { type, title }
      }
    })

    return NextResponse.json({
      success: true,
      report,
      data: reportData
    }, { status: 201 })
  } catch (error) {
    console.error('Generate report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}