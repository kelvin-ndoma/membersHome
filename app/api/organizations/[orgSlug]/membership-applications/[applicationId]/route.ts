// app/api/organizations/[orgSlug]/membership-applications/[applicationId]/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"
import { generateInviteToken, hashToken } from "@/lib/utils/tokens"
import { sendAccountSetupEmail, sendEmail } from "@/lib/email"
import { render } from "@react-email/render"
import { PlanSelectionRequestEmail } from "@/lib/email/templates/plan-selection-request"

// Get single application
export async function GET(
  req: Request,
  { params }: { params: Promise<{ orgSlug: string; applicationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { orgSlug, applicationId } = await params

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organization: { slug: orgSlug },
        organizationRole: { in: ["ORG_ADMIN", "ORG_OWNER"] },
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: { id: true, name: true },
    })

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    const application = await prisma.membershipApplication.findFirst({
      where: {
        id: applicationId,
        organizationId: organization.id,
      },
      include: {
        membershipPlan: {
          include: {
            house: true,
          },
        },
        reviewer: {
          select: { name: true, email: true },
        },
        membership: true,
      },
    })

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(application)
  } catch (error) {
    console.error("Error fetching application:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Update application status (Approve/Reject)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ orgSlug: string; applicationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { orgSlug, applicationId } = await params

    console.log("=== Approval Process Started ===")
    console.log("Organization Slug:", orgSlug)
    console.log("Application ID:", applicationId)
    console.log("User ID:", session?.user?.id)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organization: { slug: orgSlug },
        organizationRole: { in: ["ORG_ADMIN", "ORG_OWNER"] },
      },
    })

    if (!membership) {
      console.log("User is not an admin of this organization")
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: { id: true, name: true },
    })

    if (!organization) {
      console.log("Organization not found")
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    console.log("Organization found:", { id: organization.id, name: organization.name })

    const body = await req.json()
    const { status, rejectionReason, membershipNumber, waiveInitiationFee, proratedAmount, selectedPlanId } = body

    console.log("Request body:", { status, rejectionReason, membershipNumber, waiveInitiationFee, proratedAmount, selectedPlanId })

    const application = await prisma.membershipApplication.findFirst({
      where: {
        id: applicationId,
        organizationId: organization.id,
      },
      include: {
        membershipPlan: {
          include: {
            house: true,
          },
        },
      },
    })

    if (!application) {
      console.log("Application not found")
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      )
    }

    console.log("Application found:", {
      id: application.id,
      firstName: application.firstName,
      lastName: application.lastName,
      email: application.email,
      membershipPlanId: application.membershipPlanId,
      membershipPlanName: application.membershipPlan.name,
      membershipPlanHouseId: application.membershipPlan.houseId,
      membershipPlanHouse: application.membershipPlan.house,
    })

    let inviteToken: string | null = null
    let createdUser = null
    let createdMembership = null
    let createdHouseMembership = null
    let createdMembershipItem = null

    // Handle REVIEWING status - send plan selection email
    if (status === "REVIEWING") {
      console.log("=== Processing REVIEWING ===")
      
      // Generate a unique token for plan selection
      const reviewToken = generateInviteToken()
      const hashedToken = hashToken(reviewToken)
      
      // Get the house for the email
      const house = application.membershipPlan.house
      
      // Update application with review token
      await prisma.membershipApplication.update({
        where: { id: applicationId },
        data: {
          status: "REVIEWING",
          reviewToken: hashedToken,
          reviewTokenSentAt: new Date(),
        },
      })
      
      // Send email with plan selection link
      const selectPlanUrl = `${process.env.NEXT_PUBLIC_APP_URL}/apply/${orgSlug}/${house?.slug}/select-plan?token=${reviewToken}`
      
      const emailHtml = await render(
        PlanSelectionRequestEmail({
          name: application.firstName,
          houseName: house?.name || "our community",
          selectPlanUrl,
        })
      )
      
      await sendEmail({
        to: application.email,
        subject: `Select Your Membership Plan - ${house?.name}`,
        html: emailHtml,
      })
      
      console.log(`📧 Plan selection email sent to ${application.email}`)
    }

    // Handle APPROVED status
    if (status === "APPROVED") {
      console.log("=== Processing APPROVAL ===")
      
      // Use selected plan or the original one
      const finalPlanId = selectedPlanId || application.membershipPlanId
      
      // Get the plan details
      const plan = await prisma.membershipPlan.findUnique({
        where: { id: finalPlanId },
        include: { house: true },
      })

      if (!plan) {
        console.error("❌ Plan not found:", finalPlanId)
        return NextResponse.json(
          { error: "Selected plan not found" },
          { status: 400 }
        )
      }

      const targetHouseId = plan.houseId

      if (!targetHouseId) {
        console.error("❌ No house associated with membership plan:", finalPlanId)
        return NextResponse.json(
          { error: "Membership plan is not associated with a house." },
          { status: 400 }
        )
      }

      // Verify the house exists
      const houseExists = await prisma.house.findUnique({
        where: { id: targetHouseId },
        select: { id: true, name: true, slug: true }
      })

      console.log("House exists in database:", houseExists)

      if (!houseExists) {
        console.error("❌ House with ID", targetHouseId, "does not exist!")
        return NextResponse.json(
          { error: `House with ID ${targetHouseId} does not exist` },
          { status: 400 }
        )
      }

      // Find or create user
      let user = await prisma.user.findUnique({
        where: { email: application.email },
      })

      console.log("User found:", user ? { id: user.id, email: user.email, hasPassword: !!user.passwordHash } : "No user found, will create")

      if (!user) {
        // Create new user with invitation token
        inviteToken = generateInviteToken()
        const hashedToken = hashToken(inviteToken)
        
        user = await prisma.user.create({
          data: {
            email: application.email,
            name: `${application.firstName} ${application.lastName}`,
            phone: application.phone,
            invitationToken: hashedToken,
            invitationSentAt: new Date(),
          },
        })
        createdUser = user
        console.log("✅ Created new user:", { id: user.id, email: user.email })
        
        // Send account setup email
        await sendAccountSetupEmail(
          application.email,
          application.firstName,
          organization.name,
          inviteToken
        )
        console.log("📧 Sent account setup email to:", application.email)
      } else if (!user.passwordHash) {
        // User exists but no password - send account setup
        inviteToken = generateInviteToken()
        const hashedToken = hashToken(inviteToken)
        
        await prisma.user.update({
          where: { id: user.id },
          data: {
            invitationToken: hashedToken,
            invitationSentAt: new Date(),
          },
        })
        console.log("📧 User exists without password, sending account setup email to:", application.email)
        
        await sendAccountSetupEmail(
          application.email,
          application.firstName,
          organization.name,
          inviteToken
        )
      }

      // Check if user already has a membership for this organization
      let membershipRecord = await prisma.membership.findFirst({
        where: {
          userId: user.id,
          organizationId: organization.id,
        },
      })

      if (!membershipRecord) {
        // Create Organization Membership
        membershipRecord = await prisma.membership.create({
          data: {
            userId: user.id,
            organizationId: organization.id,
            organizationRole: "MEMBER",
            status: "ACTIVE",
            joinedAt: new Date(),
          },
        })
        createdMembership = membershipRecord
        console.log("✅ Created new organization membership:", membershipRecord.id)
      } else {
        console.log("✅ Using existing organization membership:", membershipRecord.id)
        createdMembership = membershipRecord
      }

      // Check if house membership already exists
      const existingHouseMembership = await prisma.houseMembership.findFirst({
        where: {
          houseId: targetHouseId,
          membershipId: membershipRecord.id,
        },
      })

      if (!existingHouseMembership) {
        // Create House Membership
        createdHouseMembership = await prisma.houseMembership.create({
          data: {
            houseId: targetHouseId,
            membershipId: membershipRecord.id,
            role: "HOUSE_MEMBER",
            status: "ACTIVE",
            joinedAt: new Date(),
          },
        })
        console.log("✅ Created new house membership:", createdHouseMembership.id)
      } else {
        console.log("✅ House membership already exists")
        createdHouseMembership = existingHouseMembership
      }

      // Calculate final amount
      let finalAmount = plan.amount
      if (proratedAmount && proratedAmount > 0) {
        finalAmount = proratedAmount
      }
      
      let initiationFee = plan.setupFee || 0
      if (waiveInitiationFee) {
        initiationFee = 0
      }

      // Check if membership item already exists
      const existingMembershipItem = await prisma.membershipItem.findFirst({
        where: {
          userId: user.id,
          organizationId: organization.id,
          membershipPlanId: finalPlanId,
          status: "ACTIVE",
        },
      })

      if (!existingMembershipItem) {
        // Create Membership Item with all details
        createdMembershipItem = await prisma.membershipItem.create({
          data: {
            userId: user.id,
            organizationId: organization.id,
            membershipPlanId: finalPlanId,
            applicationId: application.id,
            billingFrequency: plan.billingFrequency,
            amount: finalAmount,
            vatRate: plan.vatRate,
            status: "ACTIVE",
            nextBillingDate: new Date(),
            initiationFeePaid: initiationFee,
            proratedAdjustment: proratedAmount || null,
            membershipNumber: membershipNumber || null,
          },
        })
        console.log("✅ Created new membership item:", createdMembershipItem.id)
      } else {
        console.log("✅ Membership item already exists")
        createdMembershipItem = existingMembershipItem
      }

      // Update application with approval details
      await prisma.membershipApplication.update({
        where: { id: applicationId },
        data: {
          status: "APPROVED",
          approvedAt: new Date(),
          reviewedBy: session.user.id,
          reviewedAt: new Date(),
          membershipNumber: membershipNumber || null,
          initiationFee: initiationFee,
          isInitiationWaived: waiveInitiationFee || false,
          proratedAmount: proratedAmount || null,
          finalAmount,
          selectedPlanId: finalPlanId,
        },
      })

      console.log("=== Approval Summary ===")
      console.log("User created:", !!createdUser)
      console.log("Membership created/used:", !!createdMembership)
      console.log("House membership created/used:", !!createdHouseMembership)
      console.log("Membership item created/used:", !!createdMembershipItem)
      console.log("Membership number:", membershipNumber)
      console.log("Initiation fee:", initiationFee)
      console.log("Prorated amount:", proratedAmount)
      console.log("Final amount:", finalAmount)
      console.log("House name:", houseExists.name)
      console.log("House ID:", targetHouseId)
    }

    // Update application with new status (for non-APPROVED or if already updated)
    if (status !== "APPROVED" && status !== "REVIEWING") {
      const updatedApplication = await prisma.membershipApplication.update({
        where: { id: applicationId },
        data: {
          status,
          rejectionReason: status === "REJECTED" ? rejectionReason : null,
          reviewedBy: session.user.id,
          reviewedAt: new Date(),
          approvedAt: status === "APPROVED" ? new Date() : null,
          rejectedAt: status === "REJECTED" ? new Date() : null,
        },
      })
      console.log("Application updated with status:", status)
      return NextResponse.json(updatedApplication)
    }

    // Return response for REVIEWING or APPROVED
    const updatedApplication = await prisma.membershipApplication.findUnique({
      where: { id: applicationId },
    })

    return NextResponse.json({
      ...updatedApplication,
      inviteToken,
      userCreated: !!createdUser,
      membershipCreated: !!createdMembership,
      houseMembershipCreated: !!createdHouseMembership,
      membershipItemCreated: !!createdMembershipItem,
      houseDetails: createdHouseMembership ? {
        houseId: application.membershipPlan.houseId,
        houseName: application.membershipPlan.house?.name
      } : null,
    })
  } catch (error) {
    console.error("Error updating application:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}