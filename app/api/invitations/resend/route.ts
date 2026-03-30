import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireOrgAccess } from "@/lib/auth"
import { generateInviteToken, hashToken } from "@/lib/utils/tokens"
import { sendInvitationEmail } from "@/lib/email"

export async function POST(
  req: Request,
  { params }: { params: { orgSlug: string; memberId: string } }
) {
  try {
    const { membership: currentMembership } = await requireOrgAccess(params.orgSlug)

    if (
      currentMembership.organizationRole !== "ORG_OWNER" &&
      currentMembership.organizationRole !== "ORG_ADMIN"
    ) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    const membership = await prisma.membership.findUnique({
      where: { id: params.memberId },
      include: {
        user: true,
        organization: true,
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      )
    }

    if (membership.status !== "PENDING") {
      return NextResponse.json(
        { error: "Invitation can only be resent to pending members" },
        { status: 400 }
      )
    }

    const rawInviteToken = generateInviteToken()
    const hashedInviteToken = hashToken(rawInviteToken)

    await prisma.membership.update({
      where: { id: params.memberId },
      data: {
        invitedAt: new Date(),
        invitationToken: hashedInviteToken,
      },
    })

    await sendInvitationEmail(
      membership.user.email,
      membership.organization.name,
      rawInviteToken
    )

    return NextResponse.json(
      { message: "Invitation resent successfully" },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Error resending invitation:", error)
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: error?.status || 500 }
    )
  }
}