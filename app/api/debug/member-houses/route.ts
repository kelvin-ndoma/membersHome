// app/api/debug/member-houses/route.ts
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    console.log("=== Debug: Member Houses ===")
    console.log("Session user:", session?.user?.id)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const orgSlug = searchParams.get("orgSlug")

    console.log("Org slug:", orgSlug)

    if (!orgSlug) {
      return NextResponse.json({ error: "orgSlug required" }, { status: 400 })
    }

    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: { id: true, name: true }
    })

    console.log("Organization:", organization)

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organizationId: organization.id,
      },
      include: {
        houseMemberships: {
          where: { status: "ACTIVE" },
          include: {
            house: true,
          },
        },
      },
    })

    console.log("Membership found:", membership ? {
      id: membership.id,
      status: membership.status,
      organizationRole: membership.organizationRole,
      houseMembershipsCount: membership.houseMemberships.length
    } : "No membership found")

    console.log("House memberships:", membership?.houseMemberships.map(hm => ({
      id: hm.id,
      houseId: hm.houseId,
      houseName: hm.house.name,
      role: hm.role,
      status: hm.status
    })))

    return NextResponse.json({
      userId: session.user.id,
      organization: {
        id: organization.id,
        name: organization.name,
        slug: orgSlug
      },
      membership: membership ? {
        id: membership.id,
        status: membership.status,
        organizationRole: membership.organizationRole,
        joinedAt: membership.joinedAt,
      } : null,
      houseMemberships: membership?.houseMemberships || [],
      houseMembershipsCount: membership?.houseMemberships.length || 0,
    })
  } catch (error) {
    console.error("Debug endpoint error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}