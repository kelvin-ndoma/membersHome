import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"

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
    const { paused } = body

    const member = await prisma.membershipItem.findFirst({
      where: {
        id: memberId,
        organization: { slug: orgSlug },
      },
    })

    if (!member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      )
    }

    if (member.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Cannot pause a cancelled membership" },
        { status: 400 }
      )
    }

    const newStatus = paused ? "PAUSED" : "ACTIVE"

    const updateData: any = {
      status: newStatus,
    }

    if (paused) {
      updateData.pausedAt = new Date()
    } else {
      updateData.resumedAt = new Date()
    }

    const updatedMember = await prisma.membershipItem.update({
      where: { id: memberId },
      data: updateData,
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: paused ? "PAUSE_MEMBERSHIP" : "RESUME_MEMBERSHIP",
        entityType: "MembershipItem",
        entityId: memberId,
        organizationId: member.organizationId,
        oldValues: { status: member.status },
        newValues: { status: newStatus },
      },
    })

    return NextResponse.json({
      success: true,
      message: paused ? "Membership paused" : "Membership resumed",
    })
  } catch (error) {
    console.error("Error pausing/resuming membership:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}