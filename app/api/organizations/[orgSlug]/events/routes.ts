// app/api/organizations/[orgSlug]/events/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  timezone: z.string().default("UTC"),
  location: z.string().optional(),
  onlineUrl: z.string().url().optional(),
  type: z.enum(["IN_PERSON", "ONLINE", "HYBRID"]),
  isFree: z.boolean().default(true),
  capacity: z.number().int().positive().optional(),
  price: z.number().min(0).optional(),
  houseId: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgSlug } = await params;
    
    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug },
    });

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Check access
    const userMembership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organizationId: organization.id,
        status: "ACTIVE",
      },
    });

    if (!userMembership && session.user.platformRole !== "PLATFORM_ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const houseId = searchParams.get("houseId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {
      organizationId: organization.id,
    };

    if (status) where.status = status;
    if (type) where.type = type;
    if (houseId) where.houseId = houseId;
    if (startDate) where.startDate = { gte: new Date(startDate) };
    if (endDate) where.endDate = { lte: new Date(endDate) };

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
    ]);

    return NextResponse.json({
      events,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET events error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgSlug } = await params;
    
    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug },
    });

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Check permission
    const userMembership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organizationId: organization.id,
        status: "ACTIVE",
      },
    });

    const canCreate = 
      session.user.platformRole === "PLATFORM_ADMIN" ||
      userMembership?.organizationRole === "ORG_OWNER" ||
      userMembership?.organizationRole === "ORG_ADMIN";

    if (!canCreate) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = eventSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validatedData.error.issues },
        { status: 400 }
      );
    }

    // Verify house if provided
    let houseId = validatedData.data.houseId;
    if (houseId) {
      const house = await prisma.house.findFirst({
        where: {
          id: houseId,
          organizationId: organization.id,
        },
      });
      if (!house) {
        return NextResponse.json(
          { error: "House not found" },
          { status: 404 }
        );
      }
    } else {
      // Get default house or create one? For now, use the first house
      const defaultHouse = await prisma.house.findFirst({
        where: { organizationId: organization.id },
      });
      if (defaultHouse) {
        houseId = defaultHouse.id;
      } else {
        return NextResponse.json(
          { error: "No houses available. Please create a house first." },
          { status: 400 }
        );
      }
    }

    // Generate slug from title
    const slug = validatedData.data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const event = await prisma.event.create({
      data: {
        title: validatedData.data.title,
        description: validatedData.data.description,
        slug,
        organizationId: organization.id,
        houseId,
        createdBy: session.user.id,
        startDate: new Date(validatedData.data.startDate),
        endDate: new Date(validatedData.data.endDate),
        timezone: validatedData.data.timezone,
        location: validatedData.data.location,
        onlineUrl: validatedData.data.onlineUrl,
        type: validatedData.data.type,
        isFree: validatedData.data.isFree,
        capacity: validatedData.data.capacity,
        price: validatedData.data.price,
        status: validatedData.data.status,
      },
      include: {
        house: true,
      },
    });

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
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("POST event error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}