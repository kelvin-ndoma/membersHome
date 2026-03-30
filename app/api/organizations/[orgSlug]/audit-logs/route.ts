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
    const action = searchParams.get("action")
    const entityType = searchParams.get("entityType")
    const userId = searchParams.get("userId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

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

    const where: any = {
      organizationId: organization.id,
    }

    if (action) {
      where.action = action
    }

    if (entityType) {
      where.entityType = entityType
    }

    if (userId) {
      where.userId = userId
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          house: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ])

    const actions = await prisma.auditLog.groupBy({
      by: ["action"],
      where: { organizationId: organization.id },
      _count: true,
    })

    const entityTypes = await prisma.auditLog.groupBy({
      by: ["entityType"],
      where: { organizationId: organization.id },
      _count: true,
    })

    const recentActivity = await prisma.auditLog.groupBy({
      by: ["createdAt"],
      where: {
        organizationId: organization.id,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      _count: true,
    })

    return NextResponse.json({
      logs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      stats: {
        actions,
        entityTypes,
        recentActivity: recentActivity.slice(0, 30),
      },
    })
  } catch (error) {
    console.error("Error fetching audit logs:", error)
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

    const user = await prisma.user.findUnique({
      where: { id: membership.userId },
      select: { email: true },
    })

    const body = await req.json()
    const { action, entityType, entityId, oldValues, newValues, metadata, houseId } = body

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

    const log = await prisma.auditLog.create({
      data: {
        userId: membership.userId,
        userEmail: user?.email,
        action,
        entityType,
        entityId,
        organizationId: organization.id,
        houseId,
        oldValues,
        newValues,
        metadata,
      },
    })

    return NextResponse.json(log, { status: 201 })
  } catch (error) {
    console.error("Error creating audit log:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}