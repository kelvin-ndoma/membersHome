// app/api/organizations/[orgSlug]/houses/[houseSlug]/members/[memberId]/change-plan/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgSlug: string; houseSlug: string; memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { orgSlug, houseSlug, memberId } = await params

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
        organization: { slug: orgSlug },
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

    const house = await prisma.house.findFirst({
      where: {
        slug: houseSlug,
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
        { error: "Only house admins can change plans" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { membershipItemId, newPlanId } = body

    if (!membershipItemId || !newPlanId) {
      return NextResponse.json(
        { error: "Membership item ID and new plan ID are required" },
        { status: 400 }
      )
    }

    // Get the existing membership item
    const existingItem = await prisma.membershipItem.findFirst({
      where: {
        id: membershipItemId,
        status: "ACTIVE",
      },
    })

    if (!existingItem) {
      return NextResponse.json(
        { error: "Membership item not found" },
        { status: 404 }
      )
    }

    // Get the new plan
    const newPlan = await prisma.membershipPlan.findFirst({
      where: {
        id: newPlanId,
        houseId: house.id,
        status: "ACTIVE",
      },
    })

    if (!newPlan) {
      return NextResponse.json(
        { error: "New plan not found" },
        { status: 404 }
      )
    }

    // Calculate new next billing date
    let nextBillingDate = new Date()
    switch (newPlan.billingFrequency) {
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

    // Update the membership item
    const updatedItem = await prisma.membershipItem.update({
      where: { id: membershipItemId },
      data: {
        membershipPlanId: newPlanId,
        amount: newPlan.amount,
        billingFrequency: newPlan.billingFrequency,
        vatRate: newPlan.vatRate || 0,
        nextBillingDate: nextBillingDate,
      },
    })

    return NextResponse.json({
      success: true,
      membershipItem: updatedItem,
      message: "Plan changed successfully",
    })
  } catch (error) {
    console.error("Error changing plan:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}