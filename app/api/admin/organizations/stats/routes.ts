import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requirePlatformAdmin } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    await requirePlatformAdmin()

    const { searchParams } = new URL(req.url)
    const period = searchParams.get("period") || "month"

    let dateFilter: any = {}
    const now = new Date()

    if (period === "week") {
      const weekAgo = new Date(now.setDate(now.getDate() - 7))
      dateFilter = { gte: weekAgo }
    } else if (period === "month") {
      const monthAgo = new Date(now.setMonth(now.getMonth() - 1))
      dateFilter = { gte: monthAgo }
    } else if (period === "year") {
      const yearAgo = new Date(now.setFullYear(now.getFullYear() - 1))
      dateFilter = { gte: yearAgo }
    }

    const [
      totalOrganizations,
      activeOrganizations,
      totalUsers,
      totalHouses,
      totalEvents,
      totalTicketsSold,
      totalRevenue,
      recentOrganizations,
    ] = await Promise.all([
      prisma.organization.count(),
      prisma.organization.count({ where: { status: "ACTIVE" } }),
      prisma.user.count(),
      prisma.house.count(),
      prisma.event.count(),
      prisma.ticketPurchase.aggregate({
        where: {
          paymentStatus: "SUCCEEDED",
          ...(Object.keys(dateFilter).length > 0 && { paidAt: dateFilter }),
        },
        _sum: { quantity: true },
      }),
      prisma.ticketPurchase.aggregate({
        where: {
          paymentStatus: "SUCCEEDED",
          ...(Object.keys(dateFilter).length > 0 && { paidAt: dateFilter }),
        },
        _sum: { totalAmount: true },
      }),
      prisma.organization.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              memberships: true,
              houses: true,
            },
          },
        },
      }),
    ])

    const planDistribution = await prisma.organization.groupBy({
      by: ["plan"],
      _count: true,
    })

    const statusDistribution = await prisma.organization.groupBy({
      by: ["status"],
      _count: true,
    })

    return NextResponse.json({
      overview: {
        totalOrganizations,
        activeOrganizations,
        totalUsers,
        totalHouses,
        totalEvents,
        totalTicketsSold: totalTicketsSold._sum?.quantity || 0,
        totalRevenue: totalRevenue._sum?.totalAmount || 0,
      },
      planDistribution,
      statusDistribution,
      recentOrganizations,
    })
  } catch (error) {
    console.error("Error fetching platform stats:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}