import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/options"
import { prisma } from "@/prisma/client"

export async function GET(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orgSlug, houseSlug } = params

    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug }
    })

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

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

    const house = await prisma.house.findFirst({
      where: {
        slug: houseSlug,
        organizationId: organization.id
      }
    })

    if (!house) {
      return NextResponse.json({ error: "House not found" }, { status: 404 })
    }

    const plans = await prisma.membershipPlan.findMany({
      where: { houseId: house.id },
      include: {
        prices: true
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(plans)
  } catch (error) {
    console.error("Failed to fetch plans:", error)
    return NextResponse.json(
      { error: "Failed to fetch plans" },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orgSlug, houseSlug } = params
    const body = await req.json()
    const { name, description, type, isPublic, requiresApproval, features, prices } = body

    if (!name) {
      return NextResponse.json(
        { error: "Plan name is required" },
        { status: 400 }
      )
    }

    if (!prices || prices.length === 0) {
      return NextResponse.json(
        { error: "At least one price option is required" },
        { status: 400 }
      )
    }

    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug }
    })

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

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

    const house = await prisma.house.findFirst({
      where: {
        slug: houseSlug,
        organizationId: organization.id
      }
    })

    if (!house) {
      return NextResponse.json({ error: "House not found" }, { status: 404 })
    }

    const plan = await prisma.membershipPlan.create({
      data: {
        name,
        description: description || null,
        type: type || "STANDARD",
        features: features || [],
        isPublic: isPublic ?? true,
        requiresApproval: requiresApproval ?? false,
        status: "ACTIVE",
        organizationId: organization.id,
        houseId: house.id,
        prices: {
          create: prices.map((price: any) => ({
            billingFrequency: price.billingFrequency,
            amount: price.amount,
            currency: "USD",
            setupFee: price.setupFee || 0,
            vatRate: price.vatRate || 0,
          }))
        }
      },
      include: {
        prices: true
      }
    })

    return NextResponse.json(plan, { status: 201 })
  } catch (error) {
    console.error("Failed to create plan:", error)
    return NextResponse.json(
      { error: "Failed to create plan" },
      { status: 500 }
    )
  }
}