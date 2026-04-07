// app/api/organizations/[orgSlug]/houses/[houseSlug]/membership-applications/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"

export async function GET(
  req: Request,
  { params }: { params: { orgSlug: string; houseSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is organization admin
    const adminMembership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organization: { slug: params.orgSlug },
        organizationRole: { in: ["ORG_ADMIN", "ORG_OWNER"] },
      },
    })

    if (!adminMembership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const organization = await prisma.organization.findUnique({
      where: { slug: params.orgSlug },
      select: { id: true },
    })

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    const house = await prisma.house.findFirst({
      where: {
        slug: params.houseSlug,
        organizationId: organization.id,
      },
    })

    if (!house) {
      return NextResponse.json({ error: "House not found" }, { status: 404 })
    }

    // Get all membership plans for this house
    const housePlans = await prisma.membershipPlan.findMany({
      where: {
        houseId: house.id,
        status: "ACTIVE",
      },
      select: { id: true },
    })

    const planIds = housePlans.map(plan => plan.id)

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "10")

    const where: any = {
      membershipPlanId: { in: planIds },
    }

    if (status && status !== "all") {
      where.status = status.toUpperCase()
    }

    const [applications, total] = await Promise.all([
      prisma.membershipApplication.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          membershipPlan: {
            include: {
              house: true,
            },
          },
          reviewer: {
            select: { name: true, email: true },
          },
          membership: {
            select: {
              id: true,
              status: true,
              startDate: true,
              cancelledAt: true,
            },
          },
        },
      }),
      prisma.membershipApplication.count({ where }),
    ])

    // Return in the expected format
    return NextResponse.json({
      applications,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error("Error fetching applications:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}