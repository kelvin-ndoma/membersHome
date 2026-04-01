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

    const plans = await prisma.membershipPlan.findMany({
      where: {
        organizationId: organization.id,
        status: "ACTIVE",
        isPublic: true,
      },
      orderBy: { amount: "asc" },
    })

    return NextResponse.json({ plans })
  } catch (error) {
    console.error("Error fetching membership plans:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}