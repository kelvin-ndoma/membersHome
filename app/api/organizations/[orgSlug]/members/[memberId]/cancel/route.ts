import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"
import { stripe } from "@/lib/stripe/client"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orgSlug: string; memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { orgSlug, memberId } = await params

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check admin permissions
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

    const body = await req.json()
    const { reason, cancelImmediately } = body

    const member = await prisma.membershipItem.findFirst({
      where: {
        id: memberId,
        organization: { slug: orgSlug },
      },
      include: {
        application: true,
      },
    })

    if (!member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      )
    }

    console.log("Cancelling membership:", {
      memberId,
      applicationId: member.applicationId,
      currentAppStatus: member.application?.status,
    })

    // Cancel Stripe subscription if exists
    if (member.stripeSubscriptionId) {
      try {
        if (cancelImmediately) {
          await stripe.subscriptions.cancel(member.stripeSubscriptionId)
        } else {
          await stripe.subscriptions.update(member.stripeSubscriptionId, {
            cancel_at_period_end: true,
          })
        }
      } catch (error) {
        console.error("Stripe cancellation error:", error)
      }
    }

    // Update membership record
    const updatedMember = await prisma.membershipItem.update({
      where: { id: memberId },
      data: {
        status: "CANCELLED",
        cancellationReason: reason,
        cancelledBy: session.user.id,
        cancelledAt: new Date(),
        endDate: cancelImmediately ? new Date() : member.endDate,
      },
    })

    // Update application status if this membership came from an application
    let updatedApplication = null
    if (member.applicationId) {
      updatedApplication = await prisma.membershipApplication.update({
        where: { id: member.applicationId },
        data: {
          status: "CANCELLED",
        },
      })
      console.log("Updated application status to CANCELLED:", {
        applicationId: member.applicationId,
        newStatus: updatedApplication.status,
      })
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CANCEL_MEMBERSHIP",
        entityType: "MembershipItem",
        entityId: memberId,
        organizationId: member.organizationId,
        oldValues: { status: member.status },
        newValues: { status: "CANCELLED", cancelType: cancelImmediately ? "immediate" : "end_of_period" },
        metadata: { reason },
      },
    })

    return NextResponse.json({
      success: true,
      message: cancelImmediately 
        ? "Membership cancelled immediately" 
        : "Membership will be cancelled at end of billing period",
      applicationUpdated: !!updatedApplication,
      applicationStatus: updatedApplication?.status,
    })
  } catch (error) {
    console.error("Error cancelling membership:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}