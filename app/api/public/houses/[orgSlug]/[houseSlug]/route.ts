// app/api/public/houses/[orgSlug]/[houseSlug]/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  req: Request,
  { params }: { params: { orgSlug: string; houseSlug: string } }
) {
  try {
    const { orgSlug, houseSlug } = params

    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: { id: true },
    })

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    const house = await prisma.house.findFirst({
      where: {
        slug: houseSlug,
        organizationId: organization.id,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
      },
    })

    if (!house) {
      return NextResponse.json({ error: "House not found" }, { status: 404 })
    }

    return NextResponse.json(house)
  } catch (error) {
    console.error("Error fetching public house:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}