import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requirePlatformAdmin } from "@/lib/auth"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    await requirePlatformAdmin()
    const { orgId } = await params

    const body = await req.json()
    const { name, slug, description, isPrivate } = body

    // Check if organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
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
        slug,
      },
    })

    if (existingHouse) {
      return NextResponse.json(
        { error: "A house with this slug already exists in this organization" },
        { status: 400 }
      )
    }

    const house = await prisma.house.create({
      data: {
        name,
        slug,
        description,
        isPrivate: isPrivate || false,
        organizationId: orgId,
        settings: {},
      },
    })

    return NextResponse.json(house, { status: 201 })
  } catch (error) {
    console.error("Error creating house:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}