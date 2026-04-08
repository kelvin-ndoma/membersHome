import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/options"
import { prisma } from "@/prisma/client"

export async function POST(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.platformRole !== "PLATFORM_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orgId } = params
    const { name, slug, description } = await req.json()

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      )
    }

    // Check if organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: orgId }
    })

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    // Check if house with same slug exists in this organization
    const existingHouse = await prisma.house.findFirst({
      where: {
        organizationId: orgId,
        slug: slug
      }
    })

    if (existingHouse) {
      return NextResponse.json(
        { error: "House with this slug already exists in this organization" },
        { status: 400 }
      )
    }

    // Create the house
    const house = await prisma.house.create({
      data: {
        name,
        slug,
        description: description || null,
        organizationId: orgId,
        settings: {},
      }
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: "HOUSE_CREATED",
        entityType: "HOUSE",
        entityId: house.id,
        metadata: {
          houseName: house.name,
          houseSlug: house.slug,
          organizationId: orgId,
          organizationName: organization.name,
        }
      }
    })

    return NextResponse.json(house, { status: 201 })
  } catch (error) {
    console.error("Failed to create house:", error)
    return NextResponse.json(
      { error: "Failed to create house" },
      { status: 500 }
    )
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.platformRole !== "PLATFORM_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orgId } = params

    const houses = await prisma.house.findMany({
      where: { organizationId: orgId },
      include: {
        _count: {
          select: { members: true }
        }
      }
    })

    return NextResponse.json(houses)
  } catch (error) {
    console.error("Failed to fetch houses:", error)
    return NextResponse.json(
      { error: "Failed to fetch houses" },
      { status: 500 }
    )
  }
}