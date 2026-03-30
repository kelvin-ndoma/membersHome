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
    const role = searchParams.get("role")
    const search = searchParams.get("search")

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
      select: { id: true },
    })

    if (!house) {
      return NextResponse.json(
        { error: "House not found" },
        { status: 404 }
      )
    }

    const where: any = {
      houseId: house.id,
    }

    if (role) {
      where.role = role
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

    const membersWithUser = members.map(m => ({
      id: m.id,
      role: m.role,
      status: m.status,
      staffPosition: m.staffPosition,
      managerLevel: m.managerLevel,
      joinedAt: m.joinedAt,
      user: m.membership.user,
    }))

    if (search) {
      const filtered = membersWithUser.filter(m =>
        m.user.name?.toLowerCase().includes(search.toLowerCase()) ||
        m.user.email?.toLowerCase().includes(search.toLowerCase())
      )
      return NextResponse.json({
        members: filtered.slice((page - 1) * pageSize, page * pageSize),
        total: filtered.length,
        page,
        pageSize,
        totalPages: Math.ceil(filtered.length / pageSize),
      })
    }

    return NextResponse.json({
      members: membersWithUser,
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