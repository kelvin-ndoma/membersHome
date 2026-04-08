import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/options"
import { prisma } from "@/prisma/client"
import { sendOrgOwnerInvitationEmail } from "@/lib/email"
import crypto from "crypto"

// GET handler - fetch organizations
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.platformRole !== "PLATFORM_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const search = searchParams.get("search")
    const status = searchParams.get("status")

    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ]
    }
    
    if (status && status !== "all") {
      where.status = status
    }

    const organizations = await prisma.organization.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            memberships: true,
            houses: true,
          }
        }
      }
    })

    return NextResponse.json(organizations)
  } catch (error) {
    console.error("Failed to fetch organizations:", error)
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    )
  }
}

// POST handler - create organization
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.platformRole !== "PLATFORM_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, slug, description, ownerEmail, plan, houses } = await req.json()

    // Validate required fields
    if (!name || !slug || !ownerEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate houses
    if (!houses || houses.length === 0) {
      return NextResponse.json(
        { error: "At least one house is required" },
        { status: 400 }
      )
    }

    // Check if slug is taken
    const existingOrg = await prisma.organization.findUnique({
      where: { slug }
    })

    if (existingOrg) {
      return NextResponse.json(
        { error: "Organization slug already taken" },
        { status: 400 }
      )
    }

    // Find or create the owner user
    let owner = await prisma.user.findUnique({
      where: { email: ownerEmail }
    })

    // Generate invite token
    const inviteToken = crypto.randomBytes(32).toString("hex")
    const inviteExpiry = new Date()
    inviteExpiry.setDate(inviteExpiry.getDate() + 7) // 7 days expiry

    if (!owner) {
      // Create user with invite token (no password yet)
      owner = await prisma.user.create({
        data: {
          email: ownerEmail,
          invitationToken: inviteToken,
          invitationSentAt: inviteExpiry,
          platformRole: "USER",
        }
      })
    } else {
      // Update existing user with invite token
      owner = await prisma.user.update({
        where: { email: ownerEmail },
        data: {
          invitationToken: inviteToken,
          invitationSentAt: inviteExpiry,
        }
      })
    }

    // Get platform
    const platform = await prisma.platform.findFirst()
    if (!platform) {
      return NextResponse.json(
        { error: "Platform not configured" },
        { status: 500 }
      )
    }

    // Create organization, houses, and membership in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          name,
          slug,
          description: description || null,
          platformId: platform.id,
          plan: plan || "FREE",
          status: "ACTIVE",
          settings: {},
        }
      })

      // Create all houses
      const createdHouses = []
      for (const house of houses) {
        const createdHouse = await tx.house.create({
          data: {
            name: house.name,
            slug: house.slug,
            description: house.description || null,
            organizationId: organization.id,
            settings: {},
          }
        })
        createdHouses.push(createdHouse)
      }

      // Create membership for owner
      const membership = await tx.membership.create({
        data: {
          userId: owner.id,
          organizationId: organization.id,
          organizationRole: "ORG_OWNER",
          status: "PENDING", // Pending until they complete setup
        }
      })

      // Create house memberships for owner for each house
      for (const house of createdHouses) {
        await tx.houseMembership.create({
          data: {
            houseId: house.id,
            membershipId: membership.id,
            role: "HOUSE_ADMIN",
            status: "ACTIVE",
          }
        })
      }

      return { organization, houses: createdHouses, membership }
    })

    // Send invitation email to owner with setup link
    const setupLink = `${process.env.NEXTAUTH_URL}/accept-invite?token=${inviteToken}&email=${encodeURIComponent(ownerEmail)}&orgId=${result.organization.id}`
    
    await sendOrgOwnerInvitationEmail(
      owner.email,
      result.organization.name,
      setupLink,
      session.user.name || "Platform Admin"
    )

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: "ORGANIZATION_CREATED",
        entityType: "ORGANIZATION",
        entityId: result.organization.id,
        metadata: {
          organizationName: result.organization.name,
          ownerEmail,
          plan,
          housesCount: result.houses.length,
          houses: result.houses.map(h => ({ name: h.name, slug: h.slug }))
        }
      }
    })

    return NextResponse.json({
      success: true,
      organization: result.organization,
      houses: result.houses,
      message: `Organization created with ${result.houses.length} house(s) and ${ownerEmail} has been invited to set up their account`
    }, { status: 201 })

  } catch (error) {
    console.error("Failed to create organization:", error)
    return NextResponse.json(
      { error: "Failed to create organization" },
      { status: 500 }
    )
  }
}