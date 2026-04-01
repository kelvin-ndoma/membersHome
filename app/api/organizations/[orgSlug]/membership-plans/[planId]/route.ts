// app/api/organizations/[orgSlug]/membership-plans/[planId]/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"

// GET - Fetch a single membership plan by ID
export async function GET(
  req: Request,
  { params }: { params: Promise<{ orgSlug: string; planId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { orgSlug, planId } = await params

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
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

    const plan = await prisma.membershipPlan.findFirst({
      where: {
        id: planId,
        organizationId: organization.id,
      },
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

    if (!plan) {
      return NextResponse.json(
        { error: "Membership plan not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(plan)
  } catch (error) {
    console.error("Error fetching membership plan:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH - Update a membership plan
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ orgSlug: string; planId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { orgSlug, planId } = await params

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check if user is admin
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

    // Check if plan exists
    const existingPlan = await prisma.membershipPlan.findFirst({
      where: {
        id: planId,
        organizationId: organization.id,
      },
    })

    if (!existingPlan) {
      return NextResponse.json(
        { error: "Membership plan not found" },
        { status: 404 }
      )
    }

    const body = await req.json()
    const {
      name,
      description,
      type,
      status,
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

    // Validate house if provided
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

    const updatedPlan = await prisma.membershipPlan.update({
      where: { id: planId },
      data: {
        name: name !== undefined ? name : existingPlan.name,
        description: description !== undefined ? description : existingPlan.description,
        type: type !== undefined ? type : existingPlan.type,
        status: status !== undefined ? status : existingPlan.status,
        billingFrequency: billingFrequency !== undefined ? billingFrequency : existingPlan.billingFrequency,
        amount: amount !== undefined ? amount : existingPlan.amount,
        currency: currency !== undefined ? currency : existingPlan.currency,
        vatRate: vatRate !== undefined ? vatRate : existingPlan.vatRate,
        setupFee: setupFee !== undefined ? setupFee : existingPlan.setupFee,
        features: features !== undefined ? features : existingPlan.features,
        isPublic: isPublic !== undefined ? isPublic : existingPlan.isPublic,
        requiresApproval: requiresApproval !== undefined ? requiresApproval : existingPlan.requiresApproval,
        houseId: houseId !== undefined ? houseId : existingPlan.houseId,
      },
      include: {
        house: true,
      },
    })

    return NextResponse.json(updatedPlan)
  } catch (error) {
    console.error("Error updating membership plan:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - Delete a membership plan
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ orgSlug: string; planId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { orgSlug, planId } = await params

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check if user is admin
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

    // Check if plan exists and has no active members
    const plan = await prisma.membershipPlan.findFirst({
      where: {
        id: planId,
        organizationId: organization.id,
      },
      include: {
        _count: {
          select: { memberships: true, applications: true },
        },
      },
    })

    if (!plan) {
      return NextResponse.json(
        { error: "Membership plan not found" },
        { status: 404 }
      )
    }

    // Check if there are active members on this plan
    if (plan._count.memberships > 0) {
      return NextResponse.json(
        { error: "Cannot delete plan with active members. Please archive it instead." },
        { status: 400 }
      )
    }

    await prisma.membershipPlan.delete({
      where: { id: planId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting membership plan:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}