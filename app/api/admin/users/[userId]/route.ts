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
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requirePlatformAdmin()

    const { userId } = await params

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        phone: true,
        platformRole: true,
        emailVerified: true,
        mfaEnabled: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        memberships: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
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
          },
        },
        ticketPurchases: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            ticket: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
        payments: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            memberships: true,
            ticketPurchases: true,
            payments: true,
            createdEvents: true,
            createdCommunications: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    if (user.email?.startsWith("deleted_") && user.name === "Deleted User") {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching user:", error)
    return getErrorResponse(error)
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requirePlatformAdmin()

    const { userId } = await params
    const body = await req.json()
    const { name, email, phone, platformRole } = body

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        phone,
        platformRole,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        platformRole: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error updating user:", error)
    return getErrorResponse(error)
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const adminSession = await requirePlatformAdmin()
    const { userId } = await params

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          include: {
            organization: true,
          },
        },
        createdEvents: true,
        createdCommunications: true,
        createdInvoices: true,
        paidInvoices: true,
        ticketPurchases: true,
        payments: true,
        auditLogs: true,
        createdReports: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    if (user.platformRole === "PLATFORM_ADMIN") {
      const adminCount = await prisma.user.count({
        where: { platformRole: "PLATFORM_ADMIN" },
      })

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot delete the last platform admin" },
          { status: 400 }
        )
      }
    }

    const originalName = user.name
    const originalEmail = user.email

    await prisma.$transaction(async (tx) => {
      await tx.membership.updateMany({
        where: { userId },
        data: {
          status: "BANNED",
        },
      })

      const deletedEmail = `deleted_${userId}@deleted.com`

      await tx.user.update({
        where: { id: userId },
        data: {
          email: deletedEmail,
          name: "Deleted User",
          phone: null,
          passwordHash: null,
          image: null,
          platformRole: "USER",
          lastLoginAt: null,
          emailVerified: null,
          mfaEnabled: false,
          mfaSecret: null,
        },
      })
    })

    await prisma.auditLog.create({
      data: {
        userId: adminSession.user.id,
        action: "DELETE_USER",
        entityType: "User",
        entityId: userId,
        oldValues: {
          email: originalEmail,
          name: originalName,
          role: user.platformRole,
        },
        newValues: {
          name: "Deleted User",
          status: "DELETED",
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting user:", error)
    return getErrorResponse(error)
  }
}