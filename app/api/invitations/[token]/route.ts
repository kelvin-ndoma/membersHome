import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { hashToken } from "@/lib/utils/tokens"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const hashedToken = hashToken(token)

    console.log("=== INVITATION LOOKUP DEBUG ===")
    console.log("RAW TOKEN:", token)
    console.log("HASHED TOKEN:", hashedToken)

    const byTokenOnly = await prisma.membership.findFirst({
      where: {
        invitationToken: hashedToken,
      },
      include: {
        organization: true,
        user: true,
      },
    })

    console.log("MATCH BY TOKEN ONLY:", byTokenOnly ? "Yes" : "No")
    if (byTokenOnly) {
      console.log("TOKEN STATUS:", byTokenOnly.status)
      console.log("TOKEN INVITED AT:", byTokenOnly.invitedAt)
      console.log("TOKEN USER:", byTokenOnly.user?.email)
      console.log("TOKEN ORG:", byTokenOnly.organization?.name)
    }

    const byTokenAndStatus = await prisma.membership.findFirst({
      where: {
        invitationToken: hashedToken,
        status: "PENDING",
      },
    })

    console.log("MATCH BY TOKEN + STATUS:", byTokenAndStatus ? "Yes" : "No")

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    console.log("SEVEN DAYS AGO:", sevenDaysAgo.toISOString())

    const membership = await prisma.membership.findFirst({
      where: {
        invitationToken: hashedToken,
        status: "PENDING",
        invitedAt: {
          gte: sevenDaysAgo,
        },
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    console.log("MATCH FULL FILTER:", membership ? "Yes" : "No")
    console.log("=== END INVITATION LOOKUP DEBUG ===")

    if (!membership) {
      return NextResponse.json(
        { error: "Invalid or expired invitation" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      organization: membership.organization,
      user: membership.user,
      role: membership.organizationRole,
      invitedAt: membership.invitedAt,
    })
  } catch (error) {
    console.error("Error fetching invitation:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { token } = await params
    const body = await req.json()
    const { accept } = body

    console.log("🔍 Processing invitation with token:", token)

    const hashedToken = hashToken(token)

    const membership = await prisma.membership.findFirst({
      where: {
        invitationToken: hashedToken,
        status: "PENDING",
      },
      include: {
        organization: {
          select: {
            id: true,
            slug: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    if (!membership) {
      console.log("❌ No pending membership found with this token")
      return NextResponse.json(
        { error: "Invalid or expired invitation" },
        { status: 404 }
      )
    }

    if (membership.userId !== session.user.id) {
      return NextResponse.json(
        { error: "This invitation does not belong to the signed-in user" },
        { status: 403 }
      )
    }

    console.log("✅ Found membership:", membership.id)
    console.log("   User:", membership.user.email)
    console.log("   Organization:", membership.organization.name)

    if (accept) {
      await prisma.membership.update({
        where: { id: membership.id },
        data: {
          status: "ACTIVE",
          acceptedAt: new Date(),
          joinedAt: new Date(),
          invitationToken: null,
        },
      })

      console.log("✅ Membership updated to ACTIVE")
    } else {
      await prisma.membership.update({
        where: { id: membership.id },
        data: {
          status: "EXPIRED",
          invitationToken: null,
        },
      })

      console.log("❌ Membership declined")
    }

    return NextResponse.json({
      success: true,
      message: accept ? "Invitation accepted" : "Invitation declined",
      organizationSlug: membership.organization.slug,
    })
  } catch (error) {
    console.error("Error processing invitation:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}