// app/api/organizations/[orgSlug]/member/houses/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { orgSlug } = await params

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get member's membership for this organization
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organization: { slug: orgSlug },
        status: "ACTIVE",
      },
      include: {
        organization: true,
        houseMemberships: {
          where: {
            status: "ACTIVE",
          },
          include: {
            house: {
              include: {
                _count: {
                  select: {
                    members: true,
                    events: {
                      where: {
                        status: "PUBLISHED",
                        startDate: { gte: new Date() },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: "Membership not found" },
        { status: 404 }
      )
    }

    const houseMemberships = membership.houseMemberships
    const houses = houseMemberships.map(hm => ({
      ...hm.house,
      role: hm.role,
      joinedAt: hm.joinedAt,
    }))

    return NextResponse.json({
      membership: {
        id: membership.id,
        organizationRole: membership.organizationRole,
        status: membership.status,
        joinedAt: membership.joinedAt,
      },
      houseMemberships,
      houses,
    })
  } catch (error) {
    console.error("Error fetching member houses:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}