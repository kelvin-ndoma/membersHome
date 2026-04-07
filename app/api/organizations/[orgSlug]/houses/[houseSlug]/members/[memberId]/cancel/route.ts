// app/api/organizations/[orgSlug]/houses/[houseSlug]/members/[memberId]/cancel/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireHouseAccess } from "@/lib/auth"

export async function POST(
  req: Request,
  { params }: { params: { orgSlug: string; houseSlug: string; memberId: string } }
) {
  try {
    const { houseMembership: currentMember, membership } = await requireHouseAccess(params.orgSlug, params.houseSlug)

    // Only admins can cancel memberships
    if (currentMember.role !== "HOUSE_ADMIN") {
      return NextResponse.json(
        { error: "Only house admins can cancel memberships" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { reason } = body

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

    const targetMember = await prisma.houseMembership.findUnique({
      where: { id: params.memberId },
      include: {
        membership: true,
      },
    })

    if (!targetMember || targetMember.houseId !== house.id) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      )
    }

    // Cancel house membership - update status to CANCELLED
    const updatedMember = await prisma.houseMembership.update({
      where: { id: params.memberId },
      data: {
        status: "CANCELLED" as any, // Type assertion to bypass strict type checking
      },
    })

    // Find and cancel membership items separately using a direct query
    const membershipItems = await prisma.membershipItem.findMany({
      where: {
        userId: targetMember.membership.userId,
        organizationId: organization.id,
        status: "ACTIVE",
      },
    })

    if (membershipItems.length > 0) {
      for (const item of membershipItems) {
        await prisma.membershipItem.update({
          where: { id: item.id },
          data: {
            status: "CANCELLED",
            cancellationReason: reason,
            cancelledAt: new Date(),
            cancelledBy: membership.userId,
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: "Membership cancelled successfully",
    })
  } catch (error) {
    console.error("Error cancelling membership:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}