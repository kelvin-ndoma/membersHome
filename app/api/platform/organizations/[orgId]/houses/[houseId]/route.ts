import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/options"
import { prisma } from "@/prisma/client"

export async function DELETE(
  req: NextRequest,
  { params }: { params: { orgId: string; houseId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.platformRole !== "PLATFORM_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orgId, houseId } = params

    // Check if house exists and belongs to organization
    const house = await prisma.house.findFirst({
      where: {
        id: houseId,
        organizationId: orgId,
      },
      include: {
        _count: {
          select: { members: true }
        }
      }
    })

    if (!house) {
      return NextResponse.json({ error: "House not found" }, { status: 404 })
    }

    // Check if house has members
    if (house._count.members > 0) {
      return NextResponse.json(
        { error: "Cannot delete house with existing members. Remove members first." },
        { status: 400 }
      )
    }

    // Get organization name for logging
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { name: true }
    })

    // Delete the house
    await prisma.house.delete({
      where: { id: houseId }
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: "HOUSE_DELETED",
        entityType: "HOUSE",
        entityId: houseId,
        metadata: {
          houseName: house.name,
          houseSlug: house.slug,
          organizationId: orgId,
          organizationName: organization?.name,
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete house:", error)
    return NextResponse.json(
      { error: "Failed to delete house" },
      { status: 500 }
    )
  }
}