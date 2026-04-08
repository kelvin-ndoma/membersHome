import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/options"
import { prisma } from "@/prisma/client"
import { sendMembershipApprovedEmail, sendMembershipRejectedEmail } from "@/lib/email"

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
    const searchParams = req.nextUrl.searchParams
    const status = searchParams.get("status")

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

    const where: any = { organizationId: organization.id }
    if (status && status !== "all") {
      where.status = status
    }

    const applications = await prisma.membershipApplication.findMany({
      where,
      include: {
        membershipPlan: {
          select: {
            id: true,
            name: true,
            type: true,
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(applications)
  } catch (error) {
    console.error("Failed to fetch applications:", error)
    return NextResponse.json(
      { error: "Failed to fetch applications" },
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
    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      company, 
      position,
      membershipPlanId,
      notes 
    } = await req.json()

    if (!firstName || !lastName || !email || !membershipPlanId) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    // Check if plan exists
    const plan = await prisma.membershipPlan.findFirst({
      where: {
        id: membershipPlanId,
        organizationId: organization.id
      }
    })

    if (!plan) {
      return NextResponse.json(
        { error: "Membership plan not found" },
        { status: 404 }
      )
    }

    // Check if user already has an application
    const existingApplication = await prisma.membershipApplication.findFirst({
      where: {
        email,
        organizationId: organization.id,
        status: { in: ["PENDING", "REVIEWING"] }
      }
    })

    if (existingApplication) {
      return NextResponse.json(
        { error: "User already has a pending application" },
        { status: 400 }
      )
    }

    // Create application
    const application = await prisma.membershipApplication.create({
      data: {
        firstName,
        lastName,
        email,
        phone: phone || null,
        company: company || null,
        position: position || null,
        notes: notes || null,
        membershipPlanId,
        organizationId: organization.id,
        status: "PENDING",
        metadata: {},
      }
    })

    return NextResponse.json(application, { status: 201 })
  } catch (error) {
    console.error("Failed to create application:", error)
    return NextResponse.json(
      { error: "Failed to create application" },
      { status: 500 }
    )
  }
}