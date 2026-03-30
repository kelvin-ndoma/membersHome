import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireOrgAccess } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: { orgSlug: string; memberId: string } }
) {
  try {
    await requireOrgAccess(params.orgSlug)

    const membership = await prisma.membership.findUnique({
      where: { id: params.memberId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            phone: true,
            createdAt: true,
          },
        },
        houseMemberships: {
          include: {
            house: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        invoices: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
        ticketPurchases: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            ticket: true,
          },
        },
        rsvps: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            event: true,
          },
        },
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(membership)
  } catch (error) {
    console.error("Error fetching member:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { orgSlug: string; memberId: string } }
) {
  try {
    const { membership: currentMembership } = await requireOrgAccess(params.orgSlug)

    if (currentMembership.organizationRole !== "ORG_OWNER" && currentMembership.organizationRole !== "ORG_ADMIN") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { role, status, title, bio, phone } = body

    const membership = await prisma.membership.update({
      where: { id: params.memberId },
      data: {
        organizationRole: role,
        status,
        title,
        bio,
        phone,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(membership)
  } catch (error) {
    console.error("Error updating member:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { orgSlug: string; memberId: string } }
) {
  try {
    const { membership: currentMembership } = await requireOrgAccess(params.orgSlug)

    if (currentMembership.organizationRole !== "ORG_OWNER" && currentMembership.organizationRole !== "ORG_ADMIN") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    await prisma.membership.update({
      where: { id: params.memberId },
      data: { status: "BANNED" },
    })

    return NextResponse.json(
      { message: "Member removed successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error removing member:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}