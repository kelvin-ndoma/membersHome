import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/options"
import { prisma } from "@/prisma/client"

export async function GET(
  req: NextRequest,
  { params }: { params: { orgSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orgSlug } = params

    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug }
    })

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    // Verify user is org owner
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organizationId: organization.id,
        organizationRole: "ORG_OWNER",
        status: "ACTIVE"
      }
    })

    if (!membership) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const houses = await prisma.house.findMany({
      where: { organizationId: organization.id },
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

export async function POST(
  req: NextRequest,
  { params }: { params: { orgSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orgSlug } = params
    const { name, slug, description } = await req.json()

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      )
    }

    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug }
    })

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    // Verify user is org owner
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organizationId: organization.id,
        organizationRole: "ORG_OWNER",
        status: "ACTIVE"
      }
    })

    if (!membership) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if house slug exists
    const existingHouse = await prisma.house.findFirst({
      where: {
        organizationId: organization.id,
        slug
      }
    })

    if (existingHouse) {
      return NextResponse.json(
        { error: "House with this slug already exists" },
        { status: 400 }
      )
    }

    const house = await prisma.house.create({
      data: {
        name,
        slug,
        description: description || null,
        organizationId: organization.id,
        settings: {},
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