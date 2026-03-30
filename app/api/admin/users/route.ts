import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requirePlatformAdmin } from "@/lib/auth"

function getErrorResponse(error: unknown) {
  const status = (error as any)?.status || 500
  const message =
    status === 401
      ? "Unauthorized"
      : status === 403
      ? "Forbidden"
      : "Internal server error"

  return NextResponse.json({ error: message }, { status })
}

export async function GET(req: Request) {
  try {
    await requirePlatformAdmin()

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "10")
    const search = searchParams.get("search") || ""
    const platformRole = searchParams.get("platformRole")

    const where: any = {
      name: { not: "Deleted User" },
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ]
    }

    if (platformRole) {
      where.platformRole = platformRole
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          phone: true,
          platformRole: true,
          emailVerified: true,
          mfaEnabled: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              memberships: true,
              ticketPurchases: true,
              payments: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({
      users,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return getErrorResponse(error)
  }
}

export async function POST(req: Request) {
  try {
    await requirePlatformAdmin()

    const body = await req.json()
    const { email, name, phone, platformRole } = body

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }

    const user = await prisma.user.create({
      data: {
        email,
        name,
        phone,
        platformRole: platformRole || "USER",
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        platformRole: true,
        createdAt: true,
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return getErrorResponse(error)
  }
}