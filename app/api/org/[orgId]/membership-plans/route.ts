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

    const plans = await prisma.membershipPlan.findMany({
      where: { organizationId: organization.id },
      include: {
        prices: true
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(plans)
  } catch (error) {
    console.error("Failed to fetch membership plans:", error)
    return NextResponse.json(
      { error: "Failed to fetch membership plans" },
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
    const { name, description, type, features, isPublic, requiresApproval, prices } = await req.json()

    if (!name) {
      return NextResponse.json(
        { error: "Plan name is required" },
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

    const plan = await prisma.membershipPlan.create({
      data: {
        name,
        description: description || null,
        type: type || "STANDARD",
        features: features || [],
        isPublic: isPublic ?? true,
        requiresApproval: requiresApproval ?? false,
        organizationId: organization.id,
        prices: {
          create: prices || []
        }
      },
      include: {
        prices: true
      }
    })

    return NextResponse.json(plan, { status: 201 })
  } catch (error) {
    console.error("Failed to create membership plan:", error)
    return NextResponse.json(
      { error: "Failed to create membership plan" },
      { status: 500 }
    )
  }
}