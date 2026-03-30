import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireOrgAccess } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: { orgSlug: string; commId: string } }
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

    const communication = await prisma.communication.findFirst({
      where: {
        id: params.commId,
        organizationId: organization.id,
      },
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
    })

    if (!communication) {
      return NextResponse.json(
        { error: "Communication not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(communication)
  } catch (error) {
    console.error("Error fetching communication:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { orgSlug: string; commId: string } }
) {
  try {
    const { membership } = await requireOrgAccess(params.orgSlug)

    const body = await req.json()
    const { subject, body: content, type, recipientType, segmentFilters, scheduledFor, status } = body

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

    const communication = await prisma.communication.update({
      where: {
        id: params.commId,
        organizationId: organization.id,
      },
      data: {
        subject,
        body: content,
        type,
        recipientType,
        segmentFilters,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
        status,
      },
    })

    return NextResponse.json(communication)
  } catch (error) {
    console.error("Error updating communication:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { orgSlug: string; commId: string } }
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

    const communication = await prisma.communication.findFirst({
      where: {
        id: params.commId,
        organizationId: organization.id,
      },
    })

    if (!communication) {
      return NextResponse.json(
        { error: "Communication not found" },
        { status: 404 }
      )
    }

    if (communication.status === "SENT") {
      return NextResponse.json(
        { error: "Cannot delete a sent communication" },
        { status: 400 }
      )
    }

    await prisma.communication.delete({
      where: { id: params.commId },
    })

    return NextResponse.json(
      { message: "Communication deleted successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error deleting communication:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}