import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requirePlatformAdmin } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: { orgId: string } }
) {
  try {
    await requirePlatformAdmin()

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "10")
    const search = searchParams.get("search") || ""

    const where: any = {
      organizationId: params.orgId,
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ]
    }

    const [houses, total] = await Promise.all([
      prisma.house.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              members: true,
              events: true,
              tickets: true,
            },
          },
        },
      }),
      prisma.house.count({ where }),
    ])

    return NextResponse.json({
      houses,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error("Error fetching houses:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}