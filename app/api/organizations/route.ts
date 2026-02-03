import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, description, slug } = body

    // Validate
    if (!name || !slug) {
      return NextResponse.json(
        { error: "Organization name is required" },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const existingOrg = await prisma.organization.findUnique({
      where: { slug }
    })

    if (existingOrg) {
      return NextResponse.json(
        { error: "Organization slug already exists. Please choose a different name." },
        { status: 400 }
      )
    }

    // Create organization
    const organization = await prisma.organization.create({
      data: {
        name,
        description,
        slug,
      }
    })

    // Create membership for the creator as ORG_OWNER
    const membership = await prisma.membership.create({
      data: {
        userId: session.user.id,
        organizationId: organization.id,
        organizationRole: "ORG_OWNER",
        status: "ACTIVE",
        joinedAt: new Date(),
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: "organization.create",
        entityType: "Organization",
        entityId: organization.id,
        userId: session.user.id,
        userEmail: session.user.email || undefined,
        organizationId: organization.id,
        metadata: {
          name: organization.name,
          slug: organization.slug,
        },
      },
    })

    return NextResponse.json(
      { 
        message: "Organization created successfully",
        slug: organization.slug,
        organization
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Organization creation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}