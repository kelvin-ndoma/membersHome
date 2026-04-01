import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"

// Submit a new membership application (Public)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const { orgSlug } = await params

    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: { id: true },
    })

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    const body = await req.json()
    const {
      firstName,
      lastName,
      email,
      phone,
      company,
      position,
      notes,
      membershipPlanId,
    } = body

    // Validate membership plan exists
    const plan = await prisma.membershipPlan.findFirst({
      where: {
        id: membershipPlanId,
        organizationId: organization.id,
        status: "ACTIVE",
      },
    })

    if (!plan) {
      return NextResponse.json(
        { error: "Invalid membership plan" },
        { status: 400 }
      )
    }

    // Check if user already has a pending application
    const existingApplication = await prisma.membershipApplication.findFirst({
      where: {
        email,
        organizationId: organization.id,
        status: { in: ["PENDING", "REVIEWING"] },
      },
    })

    if (existingApplication) {
      return NextResponse.json(
        { error: "You already have a pending application" },
        { status: 400 }
      )
    }

    const application = await prisma.membershipApplication.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        company,
        position,
        notes,
        status: plan.requiresApproval ? "PENDING" : "APPROVED",
        organizationId: organization.id,
        membershipPlanId: plan.id,
      },
    })

    // If no approval required, auto-create membership
    if (!plan.requiresApproval) {
      // Find or create user
      let user = await prisma.user.findUnique({
        where: { email },
      })

      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name: `${firstName} ${lastName}`,
            phone,
          },
        })
      }

      // Create membership
      await prisma.membershipItem.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          membershipPlanId: plan.id,
          applicationId: application.id,
          billingFrequency: plan.billingFrequency,
          amount: plan.amount,
          vatRate: plan.vatRate,
          status: "ACTIVE",
          nextBillingDate: new Date(),
        },
      })

      await prisma.membershipApplication.update({
        where: { id: application.id },
        data: { status: "APPROVED", approvedAt: new Date() },
      })
    }

    return NextResponse.json(
      { success: true, applicationId: application.id },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error submitting application:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Get applications for organization (Admin only)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { orgSlug } = await params

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organization: { slug: orgSlug },
        organizationRole: { in: ["ORG_ADMIN", "ORG_OWNER"] },
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: { id: true },
    })

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "10")

    const where: any = {
      organizationId: organization.id,
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
          membershipPlan: true,
          reviewer: {
            select: { name: true, email: true },
          },
        },
      }),
      prisma.membershipApplication.count({ where }),
    ])

    return NextResponse.json({
      applications,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error("Error fetching applications:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}