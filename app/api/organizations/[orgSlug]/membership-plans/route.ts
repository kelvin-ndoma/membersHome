// app/api/organizations/[orgSlug]/membership-plans/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"

// Get all membership plans for an organization
export async function GET(
  req: Request,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const { searchParams } = new URL(req.url)
    const publicOnly = searchParams.get("public") === "true"

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

    const where: any = {
      organizationId: organization.id,
      status: "ACTIVE",
    }

    if (publicOnly) {
      where.isPublic = true
    }

    const plans = await prisma.membershipPlan.findMany({
      where,
      orderBy: { amount: "asc" },
      include: {
        house: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: { applications: true, memberships: true },
        },
      },
    })

    return NextResponse.json({ plans })
  } catch (error) {
    console.error("Error fetching membership plans:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Create a new membership plan (Admin only)
export async function POST(
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

    const body = await req.json()
    const {
      name,
      description,
      type,
      billingFrequency,
      amount,
      currency,
      vatRate,
      setupFee,
      features,
      isPublic,
      requiresApproval,
      houseId,
    } = body

    // Validate that the house exists and belongs to this organization
    if (houseId) {
      const house = await prisma.house.findFirst({
        where: {
          id: houseId,
          organizationId: organization.id,
        },
      })
      if (!house) {
        return NextResponse.json(
          { error: "House not found or does not belong to this organization" },
          { status: 400 }
        )
      }
    }

    const plan = await prisma.membershipPlan.create({
      data: {
        name,
        description,
        type: type || "STANDARD",
        billingFrequency,
        amount,
        currency: currency || "USD",
        vatRate: vatRate || 0,
        setupFee: setupFee || 0,
        features: features || [],
        isPublic: isPublic !== false,
        requiresApproval: requiresApproval || false,
        organizationId: organization.id,
        houseId: houseId || null,
      },
      include: {
        house: true,
      },
    })

    return NextResponse.json(plan, { status: 201 })
  } catch (error) {
    console.error("Error creating membership plan:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}