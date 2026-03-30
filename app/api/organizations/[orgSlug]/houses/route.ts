import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireOrgAccess } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: { orgSlug: string } }
) {
  try {
    await requireOrgAccess(params.orgSlug)

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "10")
    const search = searchParams.get("search") || ""

    const where: any = {
      organization: { slug: params.orgSlug },
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

export async function POST(
  req: Request,
  { params }: { params: { orgSlug: string } }
) {
  try {
    const { membership } = await requireOrgAccess(params.orgSlug)

    if (membership.organizationRole !== "ORG_OWNER" && membership.organizationRole !== "ORG_ADMIN") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { name, slug, description, isPrivate } = body

    const organization = await prisma.organization.findUnique({
      where: { slug: params.orgSlug },
    })

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    const existingHouse = await prisma.house.findFirst({
      where: {
        organizationId: organization.id,
        OR: [{ slug }, { name }],
      },
    })

    if (existingHouse) {
      return NextResponse.json(
        { error: "House with this name or slug already exists" },
        { status: 400 }
      )
    }

    const house = await prisma.house.create({
      data: {
        name,
        slug,
        description,
        isPrivate: isPrivate || false,
        organizationId: organization.id,
        settings: {},
      },
    })

    return NextResponse.json(house, { status: 201 })
  } catch (error) {
    console.error("Error creating house:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}