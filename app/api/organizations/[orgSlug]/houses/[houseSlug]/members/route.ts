import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireHouseAccess } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: { orgSlug: string; houseSlug: string } }
) {
  try {
    await requireHouseAccess(params.orgSlug, params.houseSlug)

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "10")
    const search = searchParams.get("search") || ""
    const role = searchParams.get("role")

    const organization = await prisma.organization.findUnique({
      where: { slug: params.orgSlug },
      select: { id: true },
    })

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    const house = await prisma.house.findUnique({
      where: {
        organizationId_slug: {
          organizationId: organization.id,
          slug: params.houseSlug,
        },
      },
    })

    if (!house) {
      return NextResponse.json(
        { error: "House not found" },
        { status: 404 }
      )
    }

    const where: any = {
      houseId: house.id,
      status: "ACTIVE",
    }

    if (role) {
      where.role = role
    }

    if (search) {
      where.membership = {
        user: {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        },
      }
    }

    const [members, total] = await Promise.all([
      prisma.houseMembership.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          membership: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                  phone: true,
                },
              },
            },
          },
        },
      }),
      prisma.houseMembership.count({ where }),
    ])

    return NextResponse.json({
      members: members.map(m => ({
        id: m.id,
        role: m.role,
        status: m.status,
        staffPosition: m.staffPosition,
        managerLevel: m.managerLevel,
        joinedAt: m.joinedAt,
        user: m.membership.user,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error("Error fetching house members:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(
  req: Request,
  { params }: { params: { orgSlug: string; houseSlug: string } }
) {
  try {
    // Check if user has access to this house
    const { houseMembership: currentMember } = await requireHouseAccess(params.orgSlug, params.houseSlug)
    
    // Only house admins can add members
    if (currentMember.role !== "HOUSE_ADMIN") {
      return NextResponse.json(
        { error: "Only house admins can add members" },
        { status: 403 }
      )
    }

    const organization = await prisma.organization.findUnique({
      where: { slug: params.orgSlug },
      select: { id: true },
    })

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    const house = await prisma.house.findUnique({
      where: {
        organizationId_slug: {
          organizationId: organization.id,
          slug: params.houseSlug,
        },
      },
    })

    if (!house) {
      return NextResponse.json(
        { error: "House not found" },
        { status: 404 }
      )
    }

    const body = await req.json()
    const { membershipId, role } = body

    // Check if membership exists and belongs to this organization
    const membership = await prisma.membership.findFirst({
      where: {
        id: membershipId,
        organizationId: organization.id,
        status: "ACTIVE",
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: "Member not found in this organization" },
        { status: 404 }
      )
    }

    // Check if already a member of this house
    const existing = await prisma.houseMembership.findFirst({
      where: {
        houseId: house.id,
        membershipId,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Member already in this house" },
        { status: 400 }
      )
    }

    // Create house membership
    const houseMembership = await prisma.houseMembership.create({
      data: {
        houseId: house.id,
        membershipId,
        role: role || "HOUSE_MEMBER",
        status: "ACTIVE",
        joinedAt: new Date(),
      },
      include: {
        membership: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(houseMembership, { status: 201 })
  } catch (error) {
    console.error("Error adding member to house:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}