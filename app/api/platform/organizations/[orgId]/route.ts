// app/api/platform/organizations/[orgId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.platformRole !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organization = await prisma.organization.findUnique({
      where: { id: params.orgId },
      include: {
        _count: {
          select: {
            memberships: true,
            houses: true,
            events: true,
            tickets: true,
            payments: true
          }
        },
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        },
        houses: {
          include: {
            _count: {
              select: { members: true }
            }
          }
        }
      }
    })

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ organization })
  } catch (error) {
    console.error('Get organization error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.platformRole !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updates = await req.json()

    const organization = await prisma.organization.update({
      where: { id: params.orgId },
      data: updates
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: 'ORGANIZATION_UPDATED',
        entityType: 'ORGANIZATION',
        entityId: organization.id,
        organizationId: organization.id,
        metadata: { updates }
      }
    })

    return NextResponse.json({ organization })
  } catch (error) {
    console.error('Update organization error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// app/api/platform/organizations/[orgId]/route.ts - DELETE function only

export async function DELETE(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.platformRole !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { permanent = false, reason } = body

    console.log('DELETE called with permanent:', permanent)

    const organization = await prisma.organization.findUnique({
      where: { id: params.orgId }
    })

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    if (permanent) {
      console.log('Performing PERMANENT DELETE')
      
      // Increase transaction timeout to 30 seconds
      await prisma.$transaction(
        async (tx) => {
          // Batch delete operations for efficiency
          
          // 1. Delete all member-related data for houses in this org
          const houses = await tx.house.findMany({
            where: { organizationId: params.orgId },
            select: { id: true }
          })
          const houseIds = houses.map(h => h.id)

          if (houseIds.length > 0) {
            // Delete member dashboards
            await tx.memberDashboard.deleteMany({ 
              where: { houseId: { in: houseIds } } 
            })
            
            // Delete member profiles
            await tx.memberProfile.deleteMany({ 
              where: { houseId: { in: houseIds } } 
            })
            
            // Delete member activities
            await tx.memberActivity.deleteMany({ 
              where: { houseMembership: { houseId: { in: houseIds } } } 
            })
            
            // Delete house memberships
            await tx.houseMembership.deleteMany({ 
              where: { houseId: { in: houseIds } } 
            })
          }

          // 2. Delete member portals
          await tx.memberPortal.deleteMany({ 
            where: { organizationId: params.orgId } 
          })

          // 3. Delete ticket-related data
          const tickets = await tx.ticket.findMany({
            where: { organizationId: params.orgId },
            select: { id: true }
          })
          const ticketIds = tickets.map(t => t.id)

          if (ticketIds.length > 0) {
            const purchases = await tx.ticketPurchase.findMany({
              where: { ticketId: { in: ticketIds } },
              select: { id: true }
            })
            const purchaseIds = purchases.map(p => p.id)

            if (purchaseIds.length > 0) {
              await tx.ticketValidation.deleteMany({
                where: { purchaseId: { in: purchaseIds } }
              })
              
              await tx.payment.deleteMany({
                where: { ticketPurchaseId: { in: purchaseIds } }
              })
            }

            await tx.ticketPurchase.deleteMany({
              where: { ticketId: { in: ticketIds } }
            })
          }

          await tx.ticket.deleteMany({ 
            where: { organizationId: params.orgId } 
          })

          // 4. Delete RSVPs and events
          await tx.rSVP.deleteMany({ 
            where: { organizationId: params.orgId } 
          })
          
          await tx.event.deleteMany({ 
            where: { organizationId: params.orgId } 
          })

          // 5. Delete member messages
          await tx.memberMessage.deleteMany({ 
            where: { organizationId: params.orgId } 
          })

          // 6. Delete forms and submissions
          const forms = await tx.customForm.findMany({
            where: { organizationId: params.orgId },
            select: { id: true }
          })
          const formIds = forms.map(f => f.id)

          if (formIds.length > 0) {
            await tx.formSubmission.deleteMany({
              where: { formId: { in: formIds } }
            })
          }

          await tx.customForm.deleteMany({ 
            where: { organizationId: params.orgId } 
          })

          // 7. Delete communications and reports
          await tx.communication.deleteMany({ 
            where: { organizationId: params.orgId } 
          })
          
          await tx.report.deleteMany({ 
            where: { organizationId: params.orgId } 
          })

          // 8. Delete invoices
          await tx.invoice.deleteMany({ 
            where: { organizationId: params.orgId } 
          })

          // 9. Delete membership plans and related data
          const plans = await tx.membershipPlan.findMany({
            where: { organizationId: params.orgId },
            select: { id: true }
          })
          const planIds = plans.map(p => p.id)

          if (planIds.length > 0) {
            await tx.planPrice.deleteMany({
              where: { membershipPlanId: { in: planIds } }
            })
          }

          // 10. Delete membership applications
          const applications = await tx.membershipApplication.findMany({
            where: { organizationId: params.orgId },
            select: { id: true }
          })
          const applicationIds = applications.map(a => a.id)

          if (applicationIds.length > 0) {
            await tx.payment.deleteMany({
              where: { membershipApplicationId: { in: applicationIds } }
            })
          }

          await tx.membershipApplication.deleteMany({ 
            where: { organizationId: params.orgId } 
          })

          // 11. Delete membership items and cancellation requests
          await tx.cancellationRequest.deleteMany({ 
            where: { membershipItem: { organizationId: params.orgId } } 
          })
          
          await tx.membershipItem.deleteMany({ 
            where: { organizationId: params.orgId } 
          })

          // 12. Delete membership plans
          await tx.membershipPlan.deleteMany({ 
            where: { organizationId: params.orgId } 
          })

          // 13. Delete any remaining payments
          await tx.payment.deleteMany({ 
            where: { organizationId: params.orgId } 
          })

          // 14. Delete houses
          await tx.house.deleteMany({ 
            where: { organizationId: params.orgId } 
          })

          // 15. Delete memberships
          await tx.membership.deleteMany({ 
            where: { organizationId: params.orgId } 
          })

          // 16. Delete audit logs
          await tx.auditLog.deleteMany({ 
            where: { organizationId: params.orgId } 
          })

          // 17. Finally delete the organization
          await tx.organization.delete({ 
            where: { id: params.orgId } 
          })
        },
        {
          timeout: 30000, // 30 seconds timeout
          maxWait: 5000,  // Wait up to 5 seconds to start transaction
        }
      )

      // Create final audit log
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          userEmail: session.user.email,
          action: 'ORGANIZATION_DELETED_PERMANENTLY',
          entityType: 'ORGANIZATION',
          entityId: params.orgId,
          metadata: {
            organizationName: organization.name,
            organizationSlug: organization.slug,
            reason: reason || 'No reason provided',
            deletedBy: session.user.email,
            deletedAt: new Date().toISOString(),
          }
        }
      })

      console.log('Organization permanently deleted')
      
      return NextResponse.json({
        success: true,
        message: 'Organization permanently deleted'
      })
    } else {
      // SOFT DELETE - Cancel only
      console.log('Performing SOFT DELETE')
      
      const updatedOrg = await prisma.organization.update({
        where: { id: params.orgId },
        data: {
          status: 'CANCELLED',
          suspendedAt: new Date()
        }
      })

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          userEmail: session.user.email,
          action: 'ORGANIZATION_CANCELLED',
          entityType: 'ORGANIZATION',
          entityId: organization.id,
          organizationId: organization.id,
          metadata: { reason }
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Organization cancelled',
        organization: updatedOrg
      })
    }
  } catch (error) {
    console.error('Delete organization error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}