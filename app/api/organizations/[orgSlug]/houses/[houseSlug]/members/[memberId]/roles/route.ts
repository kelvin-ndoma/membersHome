import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireHouseAccess } from "@/lib/auth"
import { canManageRole } from "@/lib/permissions/roles"

export async function PATCH(
  req: Request,
  { params }: { params: { orgSlug: string; houseSlug: string; memberId: string } }
) {
  try {
    const { houseMembership: currentMember, membership } = await requireHouseAccess(params.orgSlug, params.houseSlug)

    if (currentMember.role !== "HOUSE_ADMIN") {
      return NextResponse.json(
        { error: "Only house admins can manage roles" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { role, staffPosition, managerLevel } = body

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
    })

    if (!targetMember || targetMember.houseId !== house.id) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      )
    }

    if (!canManageRole(currentMember.role, targetMember.role)) {
      return NextResponse.json(
        { error: "Cannot manage a member with equal or higher role" },
        { status: 403 }
      )
    }

    const updatedMember = await prisma.houseMembership.update({
      where: { id: params.memberId },
      data: {
        role,
        staffPosition,
        managerLevel,
      },
      include: {
        membership: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({
      id: updatedMember.id,
      role: updatedMember.role,
      staffPosition: updatedMember.staffPosition,
      managerLevel: updatedMember.managerLevel,
      user: updatedMember.membership.user,
    })
  } catch (error) {
    console.error("Error updating member role:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}