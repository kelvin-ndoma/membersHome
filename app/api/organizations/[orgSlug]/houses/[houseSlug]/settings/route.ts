import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireHouseAccess } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: { orgSlug: string; houseSlug: string } }
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
      select: {
        id: true,
        name: true,
        description: true,
        logoUrl: true,
        isPrivate: true,
        settings: true,
      },
    })

    if (!house) {
      return NextResponse.json(
        { error: "House not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(house)
  } catch (error) {
    console.error("Error fetching house settings:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { orgSlug: string; houseSlug: string } }
) {
  try {
    const { houseMembership: currentMember } = await requireHouseAccess(params.orgSlug, params.houseSlug)

    if (currentMember.role !== "HOUSE_ADMIN") {
      return NextResponse.json(
        { error: "Only house admins can update settings" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { name, description, logoUrl, isPrivate, settings } = body

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

    const house = await prisma.house.update({
      where: {
        organizationId_slug: {
          organizationId: organization.id,
          slug: params.houseSlug,
        },
      },
      data: {
        name,
        description,
        logoUrl,
        isPrivate,
        settings,
      },
    })

    return NextResponse.json(house)
  } catch (error) {
    console.error("Error updating house settings:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}