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

    const dateFilter: any = {}
    if (startDate) {
      dateFilter.gte = new Date(startDate)
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate)
    }

    const [
      totalMembers,
      activeMembers,
      pendingMembers,
      pausedMembers,
      bannedMembers,
      admins,
      owners,
      newMembersThisMonth,
      activeThisWeek,
    ] = await Promise.all([
      prisma.membership.count({
        where: { organizationId: organization.id },
      }),
      prisma.membership.count({
        where: { organizationId: organization.id, status: "ACTIVE" },
      }),
      prisma.membership.count({
        where: { organizationId: organization.id, status: "PENDING" },
      }),
      prisma.membership.count({
        where: { organizationId: organization.id, status: "PAUSED" },
      }),
      prisma.membership.count({
        where: { organizationId: organization.id, status: "BANNED" },
      }),
      prisma.membership.count({
        where: { organizationId: organization.id, organizationRole: "ORG_ADMIN" },
      }),
      prisma.membership.count({
        where: { organizationId: organization.id, organizationRole: "ORG_OWNER" },
      }),
      prisma.membership.count({
        where: {
          organizationId: organization.id,
          joinedAt: {
            gte: new Date(new Date().setDate(1)),
          },
        },
      }),
      prisma.membership.count({
        where: {
          organizationId: organization.id,
          lastActiveAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ])

    const membersByRole = await prisma.membership.groupBy({
      by: ["organizationRole"],
      where: { organizationId: organization.id },
      _count: true,
    })

    const membersByStatus = await prisma.membership.groupBy({
      by: ["status"],
      where: { organizationId: organization.id },
      _count: true,
    })

    const recentMembers = await prisma.membership.findMany({
      where: { organizationId: organization.id },
      take: 10,
      orderBy: { joinedAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json({
      overview: {
        total: totalMembers,
        active: activeMembers,
        pending: pendingMembers,
        paused: pausedMembers,
        banned: bannedMembers,
        admins,
        owners,
        newThisMonth: newMembersThisMonth,
        activeThisWeek,
      },
      byRole: membersByRole,
      byStatus: membersByStatus,
      recentMembers,
    })
  } catch (error) {
    console.error("Error fetching membership stats:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}