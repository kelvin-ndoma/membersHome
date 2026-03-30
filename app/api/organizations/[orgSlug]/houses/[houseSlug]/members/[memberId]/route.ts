import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireHouseAccess } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: { orgSlug: string; houseSlug: string; memberId: string } }
) {
  try {
    await requireHouseAccess(params.orgSlug, params.houseSlug)

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

    const member = await prisma.houseMembership.findUnique({
      where: { id: params.memberId },
      include: {
        membership: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                phone: true,
              },
            },
          },
        },
      },
    })

    if (!member || member.houseId !== house.id) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: member.id,
      role: member.role,
      status: member.status,
      staffPosition: member.staffPosition,
      managerLevel: member.managerLevel,
      joinedAt: member.joinedAt,
      user: member.membership.user,
    })
  } catch (error) {
    console.error("Error fetching house member:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { orgSlug: string; houseSlug: string; memberId: string } }
) {
  try {
    const { houseMembership: currentMember } = await requireHouseAccess(params.orgSlug, params.houseSlug)

    if (currentMember.role !== "HOUSE_ADMIN") {
      return NextResponse.json(
        { error: "Only house admins can remove members" },
        { status: 403 }
      )
    }

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

    const member = await prisma.houseMembership.findUnique({
      where: { id: params.memberId },
    })

    if (!member || member.houseId !== house.id) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      )
    }

    await prisma.houseMembership.delete({
      where: { id: params.memberId },
    })

    return NextResponse.json(
      { message: "Member removed from house successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error removing house member:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}