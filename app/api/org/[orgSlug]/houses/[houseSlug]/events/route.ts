import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/options"
import { prisma } from "@/prisma/client"

export async function GET(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orgSlug, houseSlug } = params
    const searchParams = req.nextUrl.searchParams
    const status = searchParams.get("status")

    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug }
    })

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organizationId: organization.id,
        organizationRole: "ORG_OWNER",
        status: "ACTIVE"
      }
    })

    if (!membership) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const house = await prisma.house.findFirst({
      where: {
        slug: houseSlug,
        organizationId: organization.id
      }
    })

    if (!house) {
      return NextResponse.json({ error: "House not found" }, { status: 404 })
    }

    const where: any = { houseId: house.id }
    if (status && status !== "all") {
      where.status = status
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        _count: {
          select: { rsvps: true, tickets: true }
        }
      },
      orderBy: { startDate: "asc" }
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error("Failed to fetch events:", error)
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orgSlug, houseSlug } = params
    const body = await req.json()
    const { title, slug, description, imageUrl, startDate, endDate, location, onlineUrl, type, isFree, price, capacity, memberOnly } = body

    if (!title || !slug || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug }
    })

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organizationId: organization.id,
        organizationRole: "ORG_OWNER",
        status: "ACTIVE"
      }
    })

    if (!membership) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const house = await prisma.house.findFirst({
      where: {
        slug: houseSlug,
        organizationId: organization.id
      }
    })

    if (!house) {
      return NextResponse.json({ error: "House not found" }, { status: 404 })
    }

    const event = await prisma.event.create({
      data: {
        title,
        slug,
        description: description || null,
        imageUrl: imageUrl || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        location: location || null,
        onlineUrl: onlineUrl || null,
        type: type || "IN_PERSON",
        isFree: isFree ?? true,
        price: price || 0,
        capacity: capacity || null,
        memberOnly: memberOnly ?? false,
        status: "DRAFT",
        organizationId: organization.id,
        houseId: house.id,
        createdBy: session.user.id,
      }
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error("Failed to create event:", error)
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    )
  }
}