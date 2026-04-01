import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requirePlatformAdmin } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orgId: string; houseId: string }> }
) {
  try {
    await requirePlatformAdmin()
    const { orgId, houseId } = await params

    const house = await prisma.house.findFirst({
      where: {
        id: houseId,
        organizationId: orgId,
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
    console.error("Error fetching house:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ orgId: string; houseId: string }> }
) {
  try {
    await requirePlatformAdmin()
    const { orgId, houseId } = await params

    const body = await req.json()
    const { name, slug, description, isPrivate } = body

    // Check if house exists
    const existingHouse = await prisma.house.findFirst({
      where: {
        id: houseId,
        organizationId: orgId,
      },
    })

    if (!existingHouse) {
      return NextResponse.json(
        { error: "House not found" },
        { status: 404 }
      )
    }

    // Check if slug is unique (if changed)
    if (slug !== existingHouse.slug) {
      const slugExists = await prisma.house.findFirst({
        where: {
          organizationId: orgId,
          slug,
          id: { not: houseId },
        },
      })

      if (slugExists) {
        return NextResponse.json(
          { error: "A house with this slug already exists in this organization" },
          { status: 400 }
        )
      }
    }

    const house = await prisma.house.update({
      where: { id: houseId },
      data: {
        name,
        slug,
        description,
        isPrivate,
      },
    })

    return NextResponse.json(house)
  } catch (error) {
    console.error("Error updating house:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ orgId: string; houseId: string }> }
) {
  try {
    await requirePlatformAdmin()
    const { orgId, houseId } = await params

    // Check if house exists and belongs to the organization
    const house = await prisma.house.findFirst({
      where: {
        id: houseId,
        organizationId: orgId,
      },
      include: {
        members: true,
        events: true,
        tickets: true,
      },
    })

    if (!house) {
      return NextResponse.json(
        { error: "House not found" },
        { status: 404 }
      )
    }

    // Delete all related records
    await prisma.$transaction(async (tx) => {
      // Delete house memberships
      await tx.houseMembership.deleteMany({
        where: { houseId },
      })

      // Delete events in this house
      await tx.event.deleteMany({
        where: { houseId },
      })

      // Delete tickets in this house
      await tx.ticket.deleteMany({
        where: { houseId },
      })

      // Finally delete the house
      await tx.house.delete({
        where: { id: houseId },
      })
    })

    return NextResponse.json({
      success: true,
      message: "House deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting house:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}