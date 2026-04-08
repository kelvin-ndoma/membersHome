import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/options"
import { prisma } from "@/prisma/client"

export async function GET(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.platformRole !== "PLATFORM_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orgId } = params

    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        _count: {
          select: {
            memberships: true,
            houses: true,
            events: true,
          }
        },
        memberships: {
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                name: true,
                email: true,
              }
            }
          }
        },
        houses: {
          include: {
            _count: {
              select: {
                members: true,
              }
            }
          }
        }
      }
    })

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    return NextResponse.json(organization)
  } catch (error) {
    console.error("Failed to fetch organization:", error)
    return NextResponse.json(
      { error: "Failed to fetch organization" },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.platformRole !== "PLATFORM_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orgId } = params
    const { name, slug, description, plan } = await req.json()

    const organization = await prisma.organization.update({
      where: { id: orgId },
      data: {
        name: name || undefined,
        slug: slug || undefined,
        description: description || undefined,
        plan: plan || undefined,
      }
    })

    return NextResponse.json(organization)
  } catch (error) {
    console.error("Failed to update organization:", error)
    return NextResponse.json(
      { error: "Failed to update organization" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.platformRole !== "PLATFORM_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orgId } = params

    // Get organization details for logging
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        _count: {
          select: {
            houses: true,
            memberships: true,
            events: true,
          }
        }
      }
    })

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    console.log(`Starting deletion of organization: ${organization.name} (${orgId})`)

    // Delete in sequence - NO TRANSACTION
    // 1. Delete house memberships
    console.log("Deleting house memberships...")
    await prisma.houseMembership.deleteMany({
      where: {
        house: {
          organizationId: orgId
        }
      }
    })

    // 2. Delete all houses
    console.log("Deleting houses...")
    await prisma.house.deleteMany({
      where: { organizationId: orgId }
    })

    // 3. Delete RSVPs
    console.log("Deleting RSVPs...")
    await prisma.rSVP.deleteMany({
      where: { organizationId: orgId }
    })

    // 4. Get all ticket purchases for this organization
    const ticketPurchases = await prisma.ticketPurchase.findMany({
      where: { organizationId: orgId },
      select: { id: true }
    })
    
    // 5. Delete ticket validations
    if (ticketPurchases.length > 0) {
      console.log(`Deleting ${ticketPurchases.length} ticket validations...`)
      await prisma.ticketValidation.deleteMany({
        where: {
          purchaseId: { in: ticketPurchases.map(p => p.id) }
        }
      })
    }

    // 6. Delete ticket purchases
    console.log("Deleting ticket purchases...")
    await prisma.ticketPurchase.deleteMany({
      where: { organizationId: orgId }
    })

    // 7. Delete tickets
    console.log("Deleting tickets...")
    await prisma.ticket.deleteMany({
      where: { organizationId: orgId }
    })

    // 8. Delete events
    console.log("Deleting events...")
    await prisma.event.deleteMany({
      where: { organizationId: orgId }
    })

    // 9. Delete invoices
    console.log("Deleting invoices...")
    await prisma.invoice.deleteMany({
      where: { organizationId: orgId }
    })

    // 10. Delete payments
    console.log("Deleting payments...")
    await prisma.payment.deleteMany({
      where: { organizationId: orgId }
    })

    // 11. Delete communications
    console.log("Deleting communications...")
    await prisma.communication.deleteMany({
      where: { organizationId: orgId }
    })

    // 12. Delete reports
    console.log("Deleting reports...")
    await prisma.report.deleteMany({
      where: { organizationId: orgId }
    })

    // 13. Delete audit logs
    console.log("Deleting audit logs...")
    await prisma.auditLog.deleteMany({
      where: { organizationId: orgId }
    })

    // 14. Delete membership applications
    console.log("Deleting membership applications...")
    await prisma.membershipApplication.deleteMany({
      where: { organizationId: orgId }
    })

    // 15. Delete membership items
    console.log("Deleting membership items...")
    await prisma.membershipItem.deleteMany({
      where: { organizationId: orgId }
    })

    // 16. Delete membership plans
    console.log("Deleting membership plans...")
    await prisma.membershipPlan.deleteMany({
      where: { organizationId: orgId }
    })

    // 17. Delete custom forms
    console.log("Deleting custom forms...")
    await prisma.customForm.deleteMany({
      where: { organizationId: orgId }
    })

    // 18. Delete memberships
    console.log("Deleting memberships...")
    await prisma.membership.deleteMany({
      where: { organizationId: orgId }
    })

    // 19. Finally, delete the organization
    console.log("Deleting organization...")
    await prisma.organization.delete({
      where: { id: orgId }
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: "ORGANIZATION_DELETED",
        entityType: "ORGANIZATION",
        entityId: orgId,
        metadata: {
          organizationName: organization.name,
          housesCount: organization._count.houses,
          membersCount: organization._count.memberships,
          eventsCount: organization._count.events,
          deletedBy: session.user.email,
          deletedAt: new Date().toISOString(),
        }
      }
    })

    console.log(`Successfully deleted organization: ${organization.name}`)

    return NextResponse.json({ 
      success: true,
      message: `Organization "${organization.name}" and all associated data have been permanently deleted.`
    })
  } catch (error) {
    console.error("Failed to delete organization:", error)
    return NextResponse.json(
      { error: "Failed to delete organization. Please try again." },
      { status: 500 }
    )
  }
}