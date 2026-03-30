import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireOrgAccess, requireHouseAccess } from "@/lib/auth"

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

    const house = await prisma.house.findFirst({
      where: {
        slug: params.houseSlug,
        organization: { slug: params.orgSlug },
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