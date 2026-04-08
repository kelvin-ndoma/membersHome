import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/options"
import { prisma } from "@/prisma/client"

export async function POST(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.platformRole !== "PLATFORM_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { action } = await req.json()
    const { orgId } = params

    const status = action === "suspend" ? "SUSPENDED" : "ACTIVE"
    const suspendedAt = action === "suspend" ? new Date() : null

    const organization = await prisma.organization.update({
      where: { id: orgId },
      data: {
        status,
        suspendedAt,
      }
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: action === "suspend" ? "ORGANIZATION_SUSPENDED" : "ORGANIZATION_ACTIVATED",
        entityType: "ORGANIZATION",
        entityId: orgId,
        metadata: {
          organizationName: organization.name,
          performedBy: session.user.email,
        }
      }
    })

    return NextResponse.json({ success: true, organization })
  } catch (error) {
    console.error("Failed to update organization:", error)
    return NextResponse.json(
      { error: "Failed to update organization" },
      { status: 500 }
    )
  }
}