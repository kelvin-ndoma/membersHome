import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/options"
import { prisma } from "@/prisma/client"

export async function GET(
  req: NextRequest,
  { params }: { params: { orgSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orgSlug } = params
    const searchParams = req.nextUrl.searchParams
    const status = searchParams.get("status")
    const upcoming = searchParams.get("upcoming")

    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug }
    })

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    // Verify user is org owner
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

    const where: any = { organizationId: organization.id }
    if (status) where.status = status
    if (upcoming === "true") {
      where.startDate = { gte: new Date() }
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        house: true,
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
  { params }: { params: { orgSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orgSlug } = params
    const { title, slug, description, startDate, endDate, location, houseSlug, capacity, isFree, price } = await req.json()

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

    // Verify user is org owner
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

    let houseId = null
    if (houseSlug) {
      const house = await prisma.house.findFirst({
        where: {
          organizationId: organization.id,
          slug: houseSlug
        }
      })
      if (house) houseId = house.id
    }

    const event = await prisma.event.create({
      data: {
        title,
        slug,
        description: description || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        location: location || null,
        houseId,
        organizationId: organization.id,
        createdBy: session.user.id,
        capacity: capacity || null,
        isFree: isFree ?? true,
        price: price || 0,
        status: "DRAFT",
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