import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/prisma/client"
import { sendVerificationEmail } from "@/lib/email"

export async function POST(req: NextRequest) {
  try {
    const { token, email, orgId, name, password } = await req.json()

    if (!token || !email || !orgId || !name || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      )
    }

    // Find user with valid invite token
    const user = await prisma.user.findFirst({
      where: {
        email,
        invitationToken: token,
        invitationSentAt: {
          gt: new Date(),
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired invitation link" },
        { status: 400 }
      )
    }

    // Get the organization to verify it exists
    const organization = await prisma.organization.findUnique({
      where: { id: orgId }
    })

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        passwordHash: hashedPassword,
        invitationToken: null,
        invitationSentAt: null,
        emailVerified: new Date(), // Auto-verify since they came from invite
      }
    })

    // Update membership status from PENDING to ACTIVE and ensure role is ORG_OWNER
    await prisma.membership.updateMany({
      where: {
        userId: user.id,
        organizationId: orgId,
      },
      data: {
        status: "ACTIVE",
        acceptedAt: new Date(),
        organizationRole: "ORG_OWNER", // Ensure they are ORG_OWNER
      }
    })

    // Get the membership to find houses
    const membership = await prisma.membership.findFirst({
      where: {
        userId: user.id,
        organizationId: orgId,
      }
    })

    // Update house memberships
    if (membership) {
      await prisma.houseMembership.updateMany({
        where: {
          membershipId: membership.id,
        },
        data: {
          status: "ACTIVE",
        }
      })
    }

    // No need to send verification email since we auto-verified
    // But we'll send a welcome email instead
    // await sendWelcomeEmail(email, name, organization.name)

    return NextResponse.json({
      success: true,
      message: "Account setup complete. You can now log in.",
      redirectTo: `/org/${organization.slug}/dashboard`
    })
  } catch (error) {
    console.error("Accept invite error:", error)
    return NextResponse.json(
      { error: "Failed to set up account" },
      { status: 500 }
    )
  }
}