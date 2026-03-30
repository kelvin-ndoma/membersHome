import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireOrgAccess } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: { orgSlug: string } }
) {
  try {
    await requireOrgAccess(params.orgSlug)

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "10")
    const type = searchParams.get("type")
    const houseId = searchParams.get("houseId")

    const organization = await prisma.organization.findUnique({
      where: { slug: params.orgSlug },
      select: { id: true },
    })

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    const where: any = {
      organizationId: organization.id,
    }

    if (type) {
      where.type = type
    }

    if (houseId) {
      where.houseId = houseId
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { generatedAt: "desc" },
        include: {
          generator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          house: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),
      prisma.report.count({ where }),
    ])

    return NextResponse.json({
      reports,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error("Error fetching reports:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(
  req: Request,
  { params }: { params: { orgSlug: string } }
) {
  try {
    const { membership } = await requireOrgAccess(params.orgSlug)

    const body = await req.json()
    const { type, title, description, parameters, houseId } = body

    const organization = await prisma.organization.findUnique({
      where: { slug: params.orgSlug },
      select: { id: true },
    })

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    let data = {}
    
    switch (type) {
      case "MEMBERSHIP_GROWTH":
        data = await generateMembershipGrowthReport(organization.id, parameters)
        break
      case "EVENT_ATTENDANCE":
        data = await generateEventAttendanceReport(organization.id, parameters)
        break
      case "REVENUE_ANALYSIS":
        data = await generateRevenueAnalysisReport(organization.id, parameters)
        break
      case "TICKET_SALES":
        data = await generateTicketSalesReport(organization.id, parameters)
        break
      default:
        data = {}
    }

    const report = await prisma.report.create({
      data: {
        type,
        title,
        description,
        parameters,
        data,
        accessLevel: houseId ? "HOUSE_ONLY" : "ORGANIZATION",
        organizationId: organization.id,
        houseId,
        generatedBy: membership.userId,
        generatedAt: new Date(),
      },
    })

    return NextResponse.json(report, { status: 201 })
  } catch (error) {
    console.error("Error generating report:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

async function generateMembershipGrowthReport(organizationId: string, parameters: any) {
  const startDate = parameters.startDate ? new Date(parameters.startDate) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
  const endDate = parameters.endDate ? new Date(parameters.endDate) : new Date()

  const memberships = await prisma.membership.findMany({
    where: {
      organizationId,
      joinedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      joinedAt: true,
      organizationRole: true,
      status: true,
    },
  })

  const monthlyData: any = {}
  memberships.forEach(m => {
    const month = m.joinedAt.toISOString().slice(0, 7)
    if (!monthlyData[month]) {
      monthlyData[month] = { total: 0, byRole: {}, byStatus: {} }
    }
    monthlyData[month].total++
    monthlyData[month].byRole[m.organizationRole] = (monthlyData[month].byRole[m.organizationRole] || 0) + 1
    monthlyData[month].byStatus[m.status] = (monthlyData[month].byStatus[m.status] || 0) + 1
  })

  return {
    startDate,
    endDate,
    totalMembers: memberships.length,
    monthlyGrowth: monthlyData,
  }
}

async function generateEventAttendanceReport(organizationId: string, parameters: any) {
  const startDate = parameters.startDate ? new Date(parameters.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const endDate = parameters.endDate ? new Date(parameters.endDate) : new Date()

  const events = await prisma.event.findMany({
    where: {
      organizationId,
      startDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      rsvps: true,
      _count: {
        select: { rsvps: true },
      },
    },
  })

  const eventAttendance = events.map(event => ({
    id: event.id,
    title: event.title,
    startDate: event.startDate,
    totalRSVPs: event._count.rsvps,
    confirmedRSVPs: event.rsvps.filter(r => r.status === "CONFIRMED").length,
    attended: event.rsvps.filter(r => r.status === "ATTENDED").length,
    attendanceRate: event._count.rsvps > 0 
      ? (event.rsvps.filter(r => r.status === "ATTENDED").length / event._count.rsvps) * 100 
      : 0,
  }))

  return {
    startDate,
    endDate,
    totalEvents: events.length,
    totalRSVPs: events.reduce((sum, e) => sum + e._count.rsvps, 0),
    averageAttendanceRate: events.length > 0 
      ? eventAttendance.reduce((sum, e) => sum + e.attendanceRate, 0) / events.length 
      : 0,
    events: eventAttendance,
  }
}

async function generateRevenueAnalysisReport(organizationId: string, parameters: any) {
  const startDate = parameters.startDate ? new Date(parameters.startDate) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
  const endDate = parameters.endDate ? new Date(parameters.endDate) : new Date()

  const payments = await prisma.payment.findMany({
    where: {
      organizationId,
      status: "SUCCEEDED",
      paidAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      ticketPurchase: true,
    },
  })

  const monthlyRevenue: any = {}
  payments.forEach(p => {
    const month = p.paidAt!.toISOString().slice(0, 7)
    if (!monthlyRevenue[month]) {
      monthlyRevenue[month] = { total: 0, tickets: 0, other: 0 }
    }
    monthlyRevenue[month].total += p.amount
    if (p.ticketPurchaseId) {
      monthlyRevenue[month].tickets += p.amount
    } else {
      monthlyRevenue[month].other += p.amount
    }
  })

  return {
    startDate,
    endDate,
    totalRevenue: payments.reduce((sum, p) => sum + p.amount, 0),
    totalPayments: payments.length,
    monthlyRevenue,
    revenueByType: {
      tickets: payments.filter(p => p.ticketPurchaseId).reduce((sum, p) => sum + p.amount, 0),
      other: payments.filter(p => !p.ticketPurchaseId).reduce((sum, p) => sum + p.amount, 0),
    },
  }
}

async function generateTicketSalesReport(organizationId: string, parameters: any) {
  const startDate = parameters.startDate ? new Date(parameters.startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  const endDate = parameters.endDate ? new Date(parameters.endDate) : new Date()

  const purchases = await prisma.ticketPurchase.findMany({
    where: {
      organizationId,
      paymentStatus: "SUCCEEDED",
      paidAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      ticket: true,
    },
  })

  const ticketSales: any = {}
  purchases.forEach(p => {
    const ticketName = p.ticket.name
    if (!ticketSales[ticketName]) {
      ticketSales[ticketName] = {
        quantity: 0,
        revenue: 0,
        ticketId: p.ticketId,
      }
    }
    ticketSales[ticketName].quantity += p.quantity
    ticketSales[ticketName].revenue += p.totalAmount
  })

  return {
    startDate,
    endDate,
    totalTicketsSold: purchases.reduce((sum, p) => sum + p.quantity, 0),
    totalRevenue: purchases.reduce((sum, p) => sum + p.totalAmount, 0),
    totalPurchases: purchases.length,
    ticketSales: Object.entries(ticketSales).map(([name, data]: [string, any]) => ({
      name,
      ...data,
    })),
  }
}