import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/options"
import { prisma } from "@/prisma/client"
import { sendMembershipApprovedEmail, sendMembershipRejectedEmail } from "@/lib/email"
import crypto from "crypto"

export async function GET(
  req: NextRequest,
  { params }: { params: { orgSlug: string; applicationId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orgSlug, applicationId } = params

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

    const application = await prisma.membershipApplication.findFirst({
      where: {
        id: applicationId,
        organizationId: organization.id
      },
      include: {
        membershipPlan: {
          select: {
            id: true,
            name: true,
            type: true,
            description: true,
            features: true,
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    return NextResponse.json(application)
  } catch (error) {
    console.error("Failed to fetch application:", error)
    return NextResponse.json(
      { error: "Failed to fetch application" },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { orgSlug: string; applicationId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orgSlug, applicationId } = params
    const { status, rejectionReason, notes } = await req.json()

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

    const application = await prisma.membershipApplication.findFirst({
      where: {
        id: applicationId,
        organizationId: organization.id
      },
      include: {
        membershipPlan: true
      }
    })

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    let updatedApplication

    if (status === "APPROVED") {
      // Generate invite token for account setup
      const inviteToken = crypto.randomBytes(32).toString("hex")
      const inviteExpiry = new Date()
      inviteExpiry.setDate(inviteExpiry.getDate() + 7)

      // Check if user already exists
      let user = await prisma.user.findUnique({
        where: { email: application.email }
      })

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: application.email,
            name: `${application.firstName} ${application.lastName}`,
            invitationToken: inviteToken,
            invitationSentAt: inviteExpiry,
          }
        })
      }

      // Create membership
      const newMembership = await prisma.membership.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          organizationRole: "MEMBER",
          status: "PENDING",
        }
      })

      // Get default house or first house
      const defaultHouse = await prisma.house.findFirst({
        where: { organizationId: organization.id }
      })

      if (defaultHouse) {
        await prisma.houseMembership.create({
          data: {
            houseId: defaultHouse.id,
            membershipId: newMembership.id,
            role: "HOUSE_MEMBER",
            status: "PENDING",
          }
        })
      }

      // Update application
      updatedApplication = await prisma.membershipApplication.update({
        where: { id: applicationId },
        data: {
          status: "APPROVED",
          reviewedBy: session.user.id,
          reviewedAt: new Date(),
          approvedAt: new Date(),
          membershipId: newMembership.id,
          notes: notes || application.notes,
        }
      })

      // Send approval email with setup link
      const setupLink = `${process.env.NEXTAUTH_URL}/accept-member-invite?token=${inviteToken}&email=${encodeURIComponent(application.email)}&orgId=${organization.id}`
      await sendMembershipApprovedEmail(
        application.email,
        application.firstName,
        organization.name,
        defaultHouse?.name || "Main",
        setupLink
      )

    } else if (status === "REJECTED") {
      updatedApplication = await prisma.membershipApplication.update({
        where: { id: applicationId },
        data: {
          status: "REJECTED",
          reviewedBy: session.user.id,
          reviewedAt: new Date(),
          rejectedAt: new Date(),
          rejectionReason: rejectionReason || null,
          notes: notes || application.notes,
        }
      })

      // Send rejection email
      const contactLink = `${process.env.NEXTAUTH_URL}/contact`
      await sendMembershipRejectedEmail(
        application.email,
        application.firstName,
        organization.name,
        contactLink,
        rejectionReason
      )

    } else {
      updatedApplication = await prisma.membershipApplication.update({
        where: { id: applicationId },
        data: {
          status,
          reviewedBy: session.user.id,
          reviewedAt: status === "REVIEWING" ? new Date() : undefined,
          notes: notes || application.notes,
        }
      })
    }

    return NextResponse.json(updatedApplication)
  } catch (error) {
    console.error("Failed to update application:", error)
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { orgSlug: string; applicationId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orgSlug, applicationId } = params

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

    const application = await prisma.membershipApplication.findFirst({
      where: {
        id: applicationId,
        organizationId: organization.id
      }
    })

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    await prisma.membershipApplication.delete({
      where: { id: applicationId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete application:", error)
    return NextResponse.json(
      { error: "Failed to delete application" },
      { status: 500 }
    )
  }
}