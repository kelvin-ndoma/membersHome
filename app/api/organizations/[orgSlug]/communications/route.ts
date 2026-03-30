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
    const type = searchParams.get("type")
    const status = searchParams.get("status")

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

    if (type) {
      where.type = type
    }

    if (status) {
      where.status = status
    }

    const [communications, total] = await Promise.all([
      prisma.communication.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          creator: {
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
      prisma.communication.count({ where }),
    ])

    return NextResponse.json({
      communications,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error("Error fetching communications:", error)
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

    const body = await req.json()
    const { subject, body: content, type, recipientType, segmentFilters, scheduledFor, houseId } = body

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

    const communication = await prisma.communication.create({
      data: {
        subject,
        body: content,
        type: type || "EMAIL",
        recipientType: recipientType || "ALL_MEMBERS",
        segmentFilters,
        status: scheduledFor ? "SCHEDULED" : "DRAFT",
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        organizationId: organization.id,
        houseId,
        createdBy: membership.userId,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(communication, { status: 201 })
  } catch (error) {
    console.error("Error creating communication:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}