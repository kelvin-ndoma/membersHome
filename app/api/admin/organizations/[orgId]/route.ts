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

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    await requirePlatformAdmin()

    const { orgId } = await params

    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        _count: {
          select: {
            memberships: true,
            houses: true,
            events: true,
            tickets: true,
            invoices: true,
          },
        },
        memberships: {
          take: 10,
          orderBy: { joinedAt: "desc" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    })

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(organization)
  } catch (error) {
    console.error("Error fetching organization:", error)
    return getErrorResponse(error)
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    await requirePlatformAdmin()

    const { orgId } = await params
    const body = await req.json()
    const {
      name,
      slug,
      description,
      website,
      plan,
      status,
      billingEmail,
      primaryColor,
      secondaryColor,
    } = body

    const organization = await prisma.organization.update({
      where: { id: orgId },
      data: {
        name,
        slug,
        description,
        website,
        plan,
        status,
        billingEmail,
        primaryColor,
        secondaryColor,
      },
    })

    return NextResponse.json(organization)
  } catch (error) {
    console.error("Error updating organization:", error)
    return getErrorResponse(error)
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const adminSession = await requirePlatformAdmin()
    const { orgId } = await params

    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        memberships: true,
        houses: true,
        events: true,
        tickets: true,
        invoices: true,
        payments: true,
        reports: true,
        communications: true,
        auditLogs: true,
        rsvps: true,
        ticketPurchases: true,
      },
    })

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    await prisma.$transaction(async (tx) => {
      await tx.membership.deleteMany({
        where: { organizationId: orgId },
      })

      const houses = await tx.house.findMany({
        where: { organizationId: orgId },
        select: { id: true },
      })

      for (const house of houses) {
        await tx.houseMembership.deleteMany({
          where: { houseId: house.id },
        })
      }

      await tx.house.deleteMany({
        where: { organizationId: orgId },
      })

      const events = await tx.event.findMany({
        where: { organizationId: orgId },
        select: { id: true },
      })

      for (const event of events) {
        await tx.rSVP.deleteMany({
          where: { eventId: event.id },
        })
        await tx.ticket.deleteMany({
          where: { eventId: event.id },
        })
      }

      await tx.event.deleteMany({
        where: { organizationId: orgId },
      })

      const tickets = await tx.ticket.findMany({
        where: { organizationId: orgId },
        select: { id: true },
      })

      for (const ticket of tickets) {
        await tx.ticketPurchase.deleteMany({
          where: { ticketId: ticket.id },
        })
        await tx.ticketValidation.deleteMany({
          where: { ticketId: ticket.id },
        })
      }

      await tx.ticket.deleteMany({
        where: { organizationId: orgId },
      })

      await tx.invoice.deleteMany({
        where: { organizationId: orgId },
      })

      await tx.payment.deleteMany({
        where: { organizationId: orgId },
      })

      await tx.report.deleteMany({
        where: { organizationId: orgId },
      })

      await tx.communication.deleteMany({
        where: { organizationId: orgId },
      })

      await tx.auditLog.deleteMany({
        where: { organizationId: orgId },
      })

      await tx.rSVP.deleteMany({
        where: { organizationId: orgId },
      })

      await tx.ticketPurchase.deleteMany({
        where: { organizationId: orgId },
      })

      await tx.organization.delete({
        where: { id: orgId },
      })
    })

    await prisma.auditLog.create({
      data: {
        userId: adminSession.user.id,
        action: "DELETE_ORGANIZATION",
        entityType: "Organization",
        entityId: orgId,
        oldValues: { name: organization.name, slug: organization.slug },
        newValues: null,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Organization permanently deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting organization:", error)
    return getErrorResponse(error)
  }
}