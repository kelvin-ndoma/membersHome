import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"

export async function GET(
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

    // Check if user has access to this organization
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organization: { slug: orgSlug },
        status: "ACTIVE",
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
      select: { id: true },
    })

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    // Get the member (MembershipItem) details
    const member = await prisma.membershipItem.findFirst({
      where: {
        id: memberId,
        organizationId: organization.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            phone: true,
            createdAt: true,
          },
        },
        membershipPlan: {
          select: {
            id: true,
            name: true,
            amount: true,
            billingFrequency: true,
            currency: true,
          },
        },
        application: {
          select: {
            id: true,
            status: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        cancelledByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        invoices: {
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            invoiceNumber: true,
            amount: true,
            status: true,
            createdAt: true,
          },
        },
        payments: {
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            amount: true,
            status: true,
            stripePaymentId: true,
            createdAt: true,
          },
        },
      },
    })

    if (!member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      )
    }

    // Return member with all details including cancellation info
    return NextResponse.json({
      id: member.id,
      status: member.status,
      startDate: member.startDate,
      endDate: member.endDate,
      cancelAt: member.cancelAt,
      billingFrequency: member.billingFrequency,
      amount: member.amount,
      currency: member.currency,
      vatRate: member.vatRate,
      stripeCustomerId: member.stripeCustomerId,
      stripeSubscriptionId: member.stripeSubscriptionId,
      paymentStatus: member.paymentStatus,
      nextBillingDate: member.nextBillingDate,
      lastBilledAt: member.lastBilledAt,
      failedPaymentCount: member.failedPaymentCount,
      cancellationReason: member.cancellationReason,
      cancelledAt: member.cancelledAt,
      pausedAt: member.pausedAt,
      resumedAt: member.resumedAt,
      user: member.user,
      membershipPlan: member.membershipPlan,
      application: member.application,
      cancelledByUser: member.cancelledByUser,
      invoices: member.invoices,
      payments: member.payments,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
    })
  } catch (error) {
    console.error("Error fetching member details:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
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

    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: { id: true },
    })

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    const body = await req.json()
    const { status, cancellationReason, endDate } = body

    const member = await prisma.membershipItem.findFirst({
      where: {
        id: memberId,
        organizationId: organization.id,
      },
    })

    if (!member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      )
    }

    const updateData: any = {}
    
    if (status) updateData.status = status
    if (cancellationReason !== undefined) updateData.cancellationReason = cancellationReason
    if (endDate !== undefined) updateData.endDate = endDate
    
    if (status === "CANCELLED" && !member.cancelledAt) {
      updateData.cancelledAt = new Date()
      updateData.cancelledBy = session.user.id
    }
    
    if (status === "PAUSED" && !member.pausedAt) {
      updateData.pausedAt = new Date()
    }
    
    if (status === "ACTIVE" && member.status === "PAUSED") {
      updateData.resumedAt = new Date()
    }

    const updatedMember = await prisma.membershipItem.update({
      where: { id: memberId },
      data: updateData,
    })

    return NextResponse.json(updatedMember)
  } catch (error) {
    console.error("Error updating member:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}