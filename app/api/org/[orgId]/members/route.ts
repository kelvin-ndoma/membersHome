import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/options"
import { prisma } from "@/prisma/client"
import { sendMemberInvitationEmail } from "@/lib/email"
import crypto from "crypto"

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
    const role = searchParams.get("role")

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
    if (status) where.status = status
    if (role) where.organizationRole = role

    const members = await prisma.membership.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        houseMemberships: {
          include: {
            house: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(members)
  } catch (error) {
    console.error("Failed to fetch members:", error)
    return NextResponse.json(
      { error: "Failed to fetch members" },
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
    const { email, houseSlug, role = "MEMBER" } = await req.json()

    if (!email || !houseSlug) {
      return NextResponse.json(
        { error: "Email and house are required" },
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

    // Get the house
    const house = await prisma.house.findFirst({
      where: {
        organizationId: organization.id,
        slug: houseSlug
      }
    })

    if (!house) {
      return NextResponse.json({ error: "House not found" }, { status: 404 })
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email }
    })

    const inviteToken = crypto.randomBytes(32).toString("hex")
    const inviteExpiry = new Date()
    inviteExpiry.setDate(inviteExpiry.getDate() + 7)

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          invitationToken: inviteToken,
          invitationSentAt: inviteExpiry,
        }
      })
    }

    // Check if membership already exists
    let memberMembership = await prisma.membership.findFirst({
      where: {
        userId: user.id,
        organizationId: organization.id
      }
    })

    if (!memberMembership) {
      memberMembership = await prisma.membership.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          organizationRole: role,
          status: "PENDING",
        }
      })
    }

    // Check if house membership exists
    const existingHouseMembership = await prisma.houseMembership.findFirst({
      where: {
        houseId: house.id,
        membershipId: memberMembership.id
      }
    })

    if (!existingHouseMembership) {
      await prisma.houseMembership.create({
        data: {
          houseId: house.id,
          membershipId: memberMembership.id,
          role: "HOUSE_MEMBER",
          status: "PENDING",
        }
      })
    }

    // Send invitation email
    const acceptLink = `${process.env.NEXTAUTH_URL}/accept-member-invite?token=${inviteToken}&email=${encodeURIComponent(email)}&orgId=${organization.id}&houseId=${house.id}`
    
    await sendMemberInvitationEmail(
      email,
      organization.name,
      house.name,
      acceptLink,
      session.user.name || "Organization Owner"
    )

    return NextResponse.json({
      success: true,
      message: `Invitation sent to ${email}`
    })
  } catch (error) {
    console.error("Failed to invite member:", error)
    return NextResponse.json(
      { error: "Failed to invite member" },
      { status: 500 }
    )
  }
}