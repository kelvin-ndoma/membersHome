import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/options"
import { prisma } from "@/prisma/client"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.platformRole !== "PLATFORM_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get total counts
    const [
      totalOrganizations,
      totalUsers,
      totalMemberships,
      totalPayments,
      recentOrganizations,
      recentUsers,
    ] = await Promise.all([
      prisma.organization.count(),
      prisma.user.count(),
      prisma.membership.count(),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: "SUCCEEDED" }
      }),
      prisma.organization.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          slug: true,
          plan: true,
          status: true,
          createdAt: true,
        }
      }),
      prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          platformRole: true,
          emailVerified: true,
          createdAt: true,
        }
      }),
    ])

    // Get growth data using raw aggregation for MongoDB
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    
    const months = []
    const orgCounts = []
    const userCounts = []
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthName = date.toLocaleString('default', { month: 'short' })
      months.push(monthName)
      
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      
      const orgCount = await prisma.organization.count({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      })
      orgCounts.push(orgCount)
      
      const userCount = await prisma.user.count({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      })
      userCounts.push(userCount)
    }

    return NextResponse.json({
      totalOrganizations,
      totalUsers,
      totalMemberships,
      totalRevenue: totalPayments._sum.amount || 0,
      recentOrganizations,
      recentUsers,
      growthData: {
        months,
        organizations: orgCounts,
        users: userCounts,
      }
    })
  } catch (error) {
    console.error("Failed to fetch platform stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    )
  }
}