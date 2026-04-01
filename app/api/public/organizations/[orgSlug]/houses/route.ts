// app/api/public/organizations/[orgSlug]/houses/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const { orgSlug } = await params

    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: { id: true },
    })

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    const houses = await prisma.house.findMany({
      where: {
        organizationId: organization.id,
        isPrivate: false, // Only show public houses
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json({ houses })
  } catch (error) {
    console.error("Error fetching houses:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}