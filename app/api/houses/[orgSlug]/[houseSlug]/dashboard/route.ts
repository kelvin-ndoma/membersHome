import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireHouseAccess } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: { orgSlug: string; houseSlug: string } }
) {
  try {
    const { houseMembership } = await requireHouseAccess(params.orgSlug, params.houseSlug)

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

    const house = await prisma.house.findUnique({
      where: {
        organizationId_slug: {
          organizationId: organization.id,
          slug: params.houseSlug,
        },
      },
      select: { id: true },
    })

    if (!house) {
      return NextResponse.json(
        { error: "House not found" },
        { status: 404 }
      )
    }

    const [totalMembers, activeMembers, upcomingEvents, totalTickets, recentActivity] = await Promise.all([
      prisma.houseMembership.count({
        where: { houseId: house.id },
      }),
      prisma.houseMembership.count({
        where: { houseId: house.id, status: "ACTIVE" },
      }),
      prisma.event.count({
        where: {
          houseId: house.id,
          startDate: { gte: new Date() },
          status: "PUBLISHED",
        },
      }),
      prisma.ticket.count({
        where: { houseId: house.id, status: "ACTIVE" },
      }),
      prisma.auditLog.findMany({
        where: { houseId: house.id },
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      }),
    ])

    const memberRoleCounts = await prisma.houseMembership.groupBy({
      by: ["role"],
      where: { houseId: house.id },
      _count: true,
    })

    const recentEvents = await prisma.event.findMany({
      where: { houseId: house.id },
      take: 5,
      orderBy: { startDate: "desc" },
      select: {
        id: true,
        title: true,
        startDate: true,
        status: true,
        _count: { select: { rsvps: true } },
      },
    })

    return NextResponse.json({
      stats: {
        totalMembers,
        activeMembers,
        upcomingEvents,
        totalTickets,
      },
      memberRoles: memberRoleCounts,
      recentEvents,
      recentActivity,
      userRole: houseMembership.role,
    })
  } catch (error) {
    console.error("Error fetching house dashboard:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}