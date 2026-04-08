import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/options"
import { prisma } from "@/prisma/client"

export async function GET(
  req: NextRequest,
  { params }: { params: { orgSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orgSlug } = params

    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug }
    })

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    // Verify user is org owner
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organizationId: organization.id,
        organizationRole: "ORG_OWNER",
        status: "ACTIVE"
      }
    })

    if (!membership) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get reports
    const reports = await prisma.report.findMany({
      where: { organizationId: organization.id },
      orderBy: { generatedAt: "desc" }
    })

    // Also get some analytics
    const totalMembers = await prisma.membership.count({
      where: { organizationId: organization.id, status: "ACTIVE" }
    })

    const totalEvents = await prisma.event.count({
      where: { organizationId: organization.id }
    })

    const totalRevenue = await prisma.payment.aggregate({
      where: { organizationId: organization.id, status: "SUCCEEDED" },
      _sum: { amount: true }
    })

    const memberGrowth = await prisma.membership.groupBy({
      by: ['createdAt'],
      where: {
        organizationId: organization.id,
        createdAt: { gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) }
      },
      _count: true
    })

    return NextResponse.json({
      reports,
      analytics: {
        totalMembers,
        totalEvents,
        totalRevenue: totalRevenue._sum.amount || 0,
        memberGrowth
      }
    })
  } catch (error) {
    console.error("Failed to fetch reports:", error)
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    )
  }
}