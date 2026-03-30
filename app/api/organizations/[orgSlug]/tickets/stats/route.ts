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
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
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

    const wherePurchase: any = {
      organizationId: organization.id,
      paymentStatus: "SUCCEEDED",
    }

    if (startDate || endDate) {
      wherePurchase.paidAt = {}
      if (startDate) {
        wherePurchase.paidAt.gte = new Date(startDate)
      }
      if (endDate) {
        wherePurchase.paidAt.lte = new Date(endDate)
      }
    }

    if (houseId) {
      wherePurchase.houseId = houseId
    }

    const [totalSales, ticketsStats, salesByTicket, recentSales] = await Promise.all([
      prisma.ticketPurchase.aggregate({
        where: wherePurchase,
        _sum: {
          totalAmount: true,
          quantity: true,
        },
      }),
      prisma.ticket.aggregate({
        where: {
          organizationId: organization.id,
          ...(houseId && { houseId }),
        },
        _sum: {
          soldQuantity: true,
          totalQuantity: true,
        },
      }),
      prisma.ticketPurchase.groupBy({
        by: ["ticketId"],
        where: wherePurchase,
        _sum: {
          quantity: true,
          totalAmount: true,
        },
        orderBy: {
          _sum: {
            quantity: "desc",
          },
        },
        take: 10,
      }),
      prisma.ticketPurchase.findMany({
        where: wherePurchase,
        take: 10,
        orderBy: { paidAt: "desc" },
        include: {
          ticket: {
            select: {
              name: true,
              type: true,
            },
          },
          membership: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
    ])

    const ticketsWithDetails = await Promise.all(
      salesByTicket.map(async (sale) => {
        const ticket = await prisma.ticket.findUnique({
          where: { id: sale.ticketId },
          select: { name: true, type: true },
        })
        return {
          ticketId: sale.ticketId,
          name: ticket?.name,
          type: ticket?.type,
          quantity: sale._sum.quantity || 0,
          revenue: sale._sum.totalAmount || 0,
        }
      })
    )

    return NextResponse.json({
      totalRevenue: totalSales._sum.totalAmount || 0,
      totalTicketsSold: totalSales._sum.quantity || 0,
      totalTicketsAvailable: ticketsStats._sum.totalQuantity || 0,
      totalTicketsRemaining: (ticketsStats._sum.totalQuantity || 0) - (ticketsStats._sum.soldQuantity || 0),
      topSellingTickets: ticketsWithDetails,
      recentSales,
    })
  } catch (error) {
    console.error("Error fetching ticket stats:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}