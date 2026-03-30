import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"

export async function GET(req: Request) {
  try {
    console.log("GET /api/organizations - Checking session...")
    const session = await getServerSession(authOptions)
    console.log("Session found:", !!session)
    
    if (!session?.user?.id) {
      console.log("No session found, returning 401")
      return NextResponse.json(
        { error: "Unauthorized", message: "Please sign in to continue" },
        { status: 401 }
      )
    }

    console.log("User ID:", session.user.id)

    const memberships = await prisma.membership.findMany({
      where: {
        userId: session.user.id,
        status: "ACTIVE",
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            plan: true,
            primaryColor: true,
            secondaryColor: true,
          },
        },
        houseMemberships: {
          where: { status: "ACTIVE" },
          include: {
            house: {
              select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
              },
            },
          },
        },
      },
    })

    console.log("Found memberships:", memberships.length)

    return NextResponse.json({
      organizations: memberships.map(m => ({
        ...m.organization,
        role: m.organizationRole,
        houses: m.houseMemberships.map(h => ({
          ...h.house,
          role: h.role,
        })),
      })),
    })
  } catch (error) {
    console.error("Error fetching organizations:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    console.log("POST /api/organizations - Checking session...")
    const session = await getServerSession(authOptions)
    console.log("Session found:", !!session)
    
    if (!session?.user?.id) {
      console.log("No session found, returning 401")
      return NextResponse.json(
        { error: "Unauthorized", message: "Please sign in to continue" },
        { status: 401 }
      )
    }

    console.log("User ID:", session.user.id)

    const body = await req.json()
    const { name, slug, description, website } = body

    // Validate input
    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      )
    }

    // Check for existing organization
    const existingOrg = await prisma.organization.findFirst({
      where: {
        OR: [{ slug }, { name }],
      },
    })

    if (existingOrg) {
      return NextResponse.json(
        { error: "Organization with this name or slug already exists" },
        { status: 400 }
      )
    }

    console.log("Creating organization...")

    const organization = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name,
          slug,
          description: description || null,
          website: website || null,
          settings: {},
        },
      })

      await tx.membership.create({
        data: {
          userId: session.user.id,
          organizationId: org.id,
          organizationRole: "ORG_OWNER",
          status: "ACTIVE",
          joinedAt: new Date(),
        },
      })

      return org
    })

    console.log("Organization created:", organization.id)

    return NextResponse.json(organization, { status: 201 })
  } catch (error) {
    console.error("Error creating organization:", error)
    return NextResponse.json(
      { error: "Internal server error", message: "Failed to create organization" },
      { status: 500 }
    )
  }
}