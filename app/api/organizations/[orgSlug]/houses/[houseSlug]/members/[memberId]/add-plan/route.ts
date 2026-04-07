// app/api/organizations/[orgSlug]/houses/[houseSlug]/members/[memberId]/add-plan/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"

export async function POST(
  req: Request,
  { params }: { params: { orgSlug: string; houseSlug: string; memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check if user is org admin or house admin
    const adminMembership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organization: { slug: params.orgSlug },
        status: "ACTIVE",
      },
    })

    if (!adminMembership) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const isOrgAdmin = adminMembership.organizationRole === "ORG_ADMIN" || 
                       adminMembership.organizationRole === "ORG_OWNER"

    // Get the organization
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

    // Get the house
    const house = await prisma.house.findFirst({
      where: {
        slug: params.houseSlug,
        organizationId: organization.id,
      },
    })

    if (!house) {
      return NextResponse.json(
        { error: "House not found" },
        { status: 404 }
      )
    }

    // Check if current user is house admin
    const currentHouseMembership = await prisma.houseMembership.findFirst({
      where: {
        houseId: house.id,
        membershipId: adminMembership.id,
        status: "ACTIVE",
      },
    })

    const isHouseAdmin = currentHouseMembership?.role === "HOUSE_ADMIN" || isOrgAdmin

    if (!isHouseAdmin && !isOrgAdmin) {
      return NextResponse.json(
        { error: "Only house admins can add plans" },
        { status: 403 }
      )
    }

    // Get the target member's house membership
    const targetHouseMembership = await prisma.houseMembership.findFirst({
      where: {
        id: params.memberId,
        houseId: house.id,
        status: "ACTIVE",
      },
      include: {
        membership: true,
      },
    })

    if (!targetHouseMembership) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      )
    }

    const body = await req.json()
    const { planId } = body

    if (!planId) {
      return NextResponse.json(
        { error: "Plan ID is required" },
        { status: 400 }
      )
    }

    // Get the plan
    const plan = await prisma.membershipPlan.findFirst({
      where: {
        id: planId,
        houseId: house.id,
        status: "ACTIVE",
      },
    })

    if (!plan) {
      return NextResponse.json(
        { error: "Plan not found" },
        { status: 404 }
      )
    }

    // Check if member already has this plan
    const existingItem = await prisma.membershipItem.findFirst({
      where: {
        userId: targetHouseMembership.membership.userId,
        organizationId: organization.id,
        membershipPlanId: planId,
        status: "ACTIVE",
      },
    })

    if (existingItem) {
      return NextResponse.json(
        { error: "Member already has this plan" },
        { status: 400 }
      )
    }

    // Calculate next billing date based on billing frequency
    const startDate = new Date()
    let nextBillingDate = new Date()
    
    switch (plan.billingFrequency) {
      case "MONTHLY":
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)
        break
      case "QUARTERLY":
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 3)
        break
      case "SEMI_ANNUAL":
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 6)
        break
      case "ANNUAL":
        nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1)
        break
      default:
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)
    }

    // Create membership item for the new plan
    const membershipItem = await prisma.membershipItem.create({
      data: {
        userId: targetHouseMembership.membership.userId,
        organizationId: organization.id,
        membershipPlanId: planId,
        billingFrequency: plan.billingFrequency,
        amount: plan.amount,
        currency: plan.currency,
        vatRate: plan.vatRate || 0,
        status: "ACTIVE",
        startDate: startDate,
        nextBillingDate: nextBillingDate,
      },
    })

    // Create an invoice for the new plan
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: invoiceNumber,
        organizationId: organization.id,
        membershipId: targetHouseMembership.membershipId,
        membershipItemId: membershipItem.id,
        amount: plan.amount,
        currency: plan.currency,
        description: `Additional plan: ${plan.name}`,
        status: "PENDING",
        dueDate: nextBillingDate,
        createdBy: adminMembership.userId,
      },
    })

    return NextResponse.json({
      success: true,
      membershipItem,
      invoice,
      message: "Plan added successfully",
    })
  } catch (error) {
    console.error("Error adding plan:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}