import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"
import { z } from "zod"

const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  startDate: z.string().transform((val) => new Date(val)), // Accept any string and convert to Date
  endDate: z.string().transform((val) => new Date(val)),   // Accept any string and convert to Date
  timezone: z.string().default("UTC"),
  location: z.string().optional(),
  onlineUrl: z.string().url().optional().or(z.literal("")),
  type: z.enum(["IN_PERSON", "ONLINE", "HYBRID"]),
  isFree: z.boolean().default(true),
  memberOnly: z.boolean().default(false),
  capacity: z.number().int().positive().optional().nullable(),
  price: z.number().min(0).optional().nullable(),
  currency: z.string().default("USD"),
  houseId: z.string().min(1, "House is required"),
  status: z.enum(["DRAFT", "PUBLISHED", "CANCELLED", "COMPLETED"]).default("DRAFT"),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orgSlug } = await params
    
    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug },
    })

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    // Check access
    const userMembership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organizationId: organization.id,
        status: "ACTIVE",
      },
    })

    if (!userMembership && session.user.platformRole !== "PLATFORM_ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const status = searchParams.get("status")
    const type = searchParams.get("type")
    const houseId = searchParams.get("houseId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const where: any = {
      organizationId: organization.id,
    }

    if (status) where.status = status
    if (type) where.type = type
    if (houseId) where.houseId = houseId
    if (startDate) where.startDate = { gte: new Date(startDate) }
    if (endDate) where.endDate = { lte: new Date(endDate) }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          house: true,
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              rsvps: true,
              tickets: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { startDate: "desc" },
      }),
      prisma.event.count({ where }),
    ])

    return NextResponse.json({
      events,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("GET events error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orgSlug } = await params
    
    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug },
    })

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    // Check permission
    const userMembership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organizationId: organization.id,
        status: "ACTIVE",
      },
    })

    const canCreate = 
      session.user.platformRole === "PLATFORM_ADMIN" ||
      userMembership?.organizationRole === "ORG_OWNER" ||
      userMembership?.organizationRole === "ORG_ADMIN"

    if (!canCreate) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    const body = await request.json()
    console.log("Creating event with data:", body)

    const validatedData = eventSchema.safeParse(body)

    if (!validatedData.success) {
      console.error("Validation error:", validatedData.error.issues)
      return NextResponse.json(
        { error: "Validation failed", details: validatedData.error.issues },
        { status: 400 }
      )
    }

    // Verify house exists
    const house = await prisma.house.findFirst({
      where: {
        id: validatedData.data.houseId,
        organizationId: organization.id,
      },
    })

    if (!house) {
      return NextResponse.json(
        { error: "House not found in this organization" },
        { status: 404 }
      )
    }

    // Generate slug from title
    const slug = validatedData.data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")

    const event = await prisma.event.create({
      data: {
        title: validatedData.data.title,
        description: validatedData.data.description,
        imageUrl: validatedData.data.imageUrl,
        slug,
        organizationId: organization.id,
        houseId: validatedData.data.houseId,
        createdBy: session.user.id,
        startDate: validatedData.data.startDate,
        endDate: validatedData.data.endDate,
        timezone: validatedData.data.timezone,
        location: validatedData.data.location,
        onlineUrl: validatedData.data.onlineUrl,
        type: validatedData.data.type,
        isFree: validatedData.data.isFree,
        memberOnly: validatedData.data.memberOnly,
        capacity: validatedData.data.capacity,
        price: validatedData.data.price,
        currency: validatedData.data.currency,
        status: validatedData.data.status,
      },
      include: {
        house: true,
      },
    })

    console.log("Event created:", event.id)

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: "EVENT_CREATED",
        entityType: "Event",
        entityId: event.id,
        userId: session.user.id,
        userEmail: session.user.email || undefined,
        organizationId: organization.id,
        newValues: {
          title: event.title,
          startDate: event.startDate,
        },
      },
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error("POST event error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}