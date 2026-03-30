import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireOrgAccess } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: { orgSlug: string; ticketId: string } }
) {
  try {
    await requireOrgAccess(params.orgSlug)

    const { searchParams } = new URL(req.url)
    const period = searchParams.get("period") || "day"

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

    let dateFilter: any = {}
    const now = new Date()

    if (period === "day") {
      dateFilter = { gte: new Date(now.setHours(0, 0, 0, 0)) }
    } else if (period === "week") {
      dateFilter = { gte: new Date(now.setDate(now.getDate() - 7)) }
    } else if (period === "month") {
      dateFilter = { gte: new Date(now.setMonth(now.getMonth() - 1)) }
    }

    const [sales, validations, purchases] = await Promise.all([
      prisma.ticketPurchase.aggregate({
        where: {
          ticketId: params.ticketId,
          paymentStatus: "SUCCEEDED",
          ...(Object.keys(dateFilter).length > 0 && { paidAt: dateFilter }),
        },
        _sum: {
          quantity: true,
          totalAmount: true,
        },
      }),
      prisma.ticketValidation.count({
        where: {
          ticketId: params.ticketId,
          validatedAt: dateFilter,
        },
      }),
      prisma.ticketPurchase.findMany({
        where: {
          ticketId: params.ticketId,
          paymentStatus: "SUCCEEDED",
        },
        take: 50,
        orderBy: { paidAt: "desc" },
        include: {
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

    return NextResponse.json({
      totalSold: sales._sum.quantity || 0,
      totalRevenue: sales._sum.totalAmount || 0,
      totalValidations: validations,
      recentPurchases: purchases,
    })
  } catch (error) {
    console.error("Error fetching ticket sales:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}