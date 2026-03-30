import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireOrgAccess } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: { orgSlug: string; ticketId: string } }
) {
  try {
    await requireOrgAccess(params.orgSlug)

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

    const ticket = await prisma.ticket.findFirst({
      where: {
        id: params.ticketId,
        organizationId: organization.id,
      },
      include: {
        house: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
          },
        },
        purchases: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            membership: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            purchases: true,
            validations: true,
          },
        },
      },
    })

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(ticket)
  } catch (error) {
    console.error("Error fetching ticket:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { orgSlug: string; ticketId: string } }
) {
  try {
    const { membership } = await requireOrgAccess(params.orgSlug)

    const body = await req.json()
    const {
      name,
      description,
      price,
      totalQuantity,
      maxPerPurchase,
      memberOnly,
      salesStartAt,
      salesEndAt,
      validFrom,
      validUntil,
      status,
      isPublic,
      earlyBirdPrice,
      memberPrice,
    } = body

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

    const ticket = await prisma.ticket.update({
      where: {
        id: params.ticketId,
        organizationId: organization.id,
      },
      data: {
        name,
        description,
        price,
        totalQuantity,
        maxPerPurchase,
        memberOnly,
        salesStartAt: salesStartAt ? new Date(salesStartAt) : undefined,
        salesEndAt: salesEndAt ? new Date(salesEndAt) : undefined,
        validFrom: validFrom ? new Date(validFrom) : undefined,
        validUntil: validUntil ? new Date(validUntil) : undefined,
        status,
        isPublic,
        earlyBirdPrice,
        memberPrice,
      },
    })

    return NextResponse.json(ticket)
  } catch (error) {
    console.error("Error updating ticket:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { orgSlug: string; ticketId: string } }
) {
  try {
    const { membership } = await requireOrgAccess(params.orgSlug)

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

    await prisma.ticket.update({
      where: {
        id: params.ticketId,
        organizationId: organization.id,
      },
      data: { status: "CANCELLED" },
    })

    return NextResponse.json(
      { message: "Ticket cancelled successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error cancelling ticket:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}