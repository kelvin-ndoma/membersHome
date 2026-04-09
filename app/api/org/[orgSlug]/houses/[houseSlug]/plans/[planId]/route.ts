import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/options"
import { prisma } from "@/prisma/client"

export async function GET(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string; planId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orgSlug, planId } = params

    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug }
    })

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

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

    const plan = await prisma.membershipPlan.findFirst({
      where: { id: planId },
      include: {
        prices: true
      }
    })

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 })
    }

    return NextResponse.json(plan)
  } catch (error) {
    console.error("Failed to fetch plan:", error)
    return NextResponse.json(
      { error: "Failed to fetch plan" },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string; planId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orgSlug, planId } = params
    const body = await req.json()
    const { name, description, type, isPublic, requiresApproval, features, prices } = body

    if (!name) {
      return NextResponse.json(
        { error: "Plan name is required" },
        { status: 400 }
      )
    }

    if (!prices || prices.length === 0) {
      return NextResponse.json(
        { error: "At least one price option is required" },
        { status: 400 }
      )
    }

    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug }
    })

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

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

    // Update the plan
    const updatedPlan = await prisma.membershipPlan.update({
      where: { id: planId },
      data: {
        name,
        description: description || null,
        type: type || "STANDARD",
        features: features || [],
        isPublic: isPublic ?? true,
        requiresApproval: requiresApproval ?? false,
      }
    })

    // Handle price updates: delete existing and create new ones
    await prisma.planPrice.deleteMany({
      where: { membershipPlanId: planId }
    })

    await prisma.planPrice.createMany({
      data: prices.map((price: any) => ({
        membershipPlanId: planId,
        billingFrequency: price.billingFrequency,
        amount: price.amount,
        currency: "USD",
        setupFee: price.setupFee || 0,
        vatRate: price.vatRate || 0,
      }))
    })

    const result = await prisma.membershipPlan.findUnique({
      where: { id: planId },
      include: { prices: true }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Failed to update plan:", error)
    return NextResponse.json(
      { error: "Failed to update plan" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string; planId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orgSlug, planId } = params
    const { status } = await req.json()

    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug }
    })

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

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

    const plan = await prisma.membershipPlan.update({
      where: { id: planId },
      data: { status }
    })

    return NextResponse.json(plan)
  } catch (error) {
    console.error("Failed to update plan status:", error)
    return NextResponse.json(
      { error: "Failed to update plan status" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string; planId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orgSlug, planId } = params

    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug }
    })

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

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

    // Delete all associated prices first
    await prisma.planPrice.deleteMany({
      where: { membershipPlanId: planId }
    })

    // Delete the plan
    await prisma.membershipPlan.delete({
      where: { id: planId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete plan:", error)
    return NextResponse.json(
      { error: "Failed to delete plan" },
      { status: 500 }
    )
  }
}