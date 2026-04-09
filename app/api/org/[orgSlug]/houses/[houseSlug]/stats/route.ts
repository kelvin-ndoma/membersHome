import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/options"
import { prisma } from "@/prisma/client"

export async function GET(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orgSlug, houseSlug } = params

    // Find organization by slug
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

    // Find house by slug
    const house = await prisma.house.findFirst({
      where: {
        slug: houseSlug,
        organizationId: organization.id
      }
    })

    if (!house) {
      return NextResponse.json({ error: "House not found" }, { status: 404 })
    }

    // Get house stats
    const [memberCount, eventCount, pendingApplications, recentMembers, upcomingEvents] = await Promise.all([
      prisma.houseMembership.count({
        where: { houseId: house.id, status: "ACTIVE" }
      }),
      prisma.event.count({
        where: { houseId: house.id }
      }),
      prisma.membershipApplication.count({
        where: { organizationId: organization.id, status: "PENDING" }
      }),
      prisma.houseMembership.findMany({
        where: { houseId: house.id, status: "ACTIVE" },
        take: 5,
        orderBy: { joinedAt: "desc" },
        include: {
          membership: {
            include: {
              user: {
                select: { name: true, email: true }
              }
            }
          }
        }
      }),
      prisma.event.findMany({
        where: {
          houseId: house.id,
          startDate: { gte: new Date() },
          status: "PUBLISHED"
        },
        orderBy: { startDate: "asc" },
        take: 5,
        select: {
          id: true,
          title: true,
          startDate: true,
          location: true,
        }
      })
    ])

    return NextResponse.json({
      id: house.id,
      name: house.name,
      slug: house.slug,
      description: house.description,
      _count: {
        members: memberCount,
        events: eventCount
      },
      recentMembers: recentMembers.map(hm => ({
        id: hm.id,
        user: hm.membership.user,
        joinedAt: hm.joinedAt
      })),
      upcomingEvents,
      pendingApplications
    })
  } catch (error) {
    console.error("Failed to fetch house stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch house stats" },
      { status: 500 }
    )
  }
}