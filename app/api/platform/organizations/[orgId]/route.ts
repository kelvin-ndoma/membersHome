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

// app/api/platform/organizations/[orgId]/route.ts - DELETE function

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
      
      // CRITICAL: Delete in correct order - children before parents
      await prisma.$transaction(
        async (tx) => {
          // 1. First, delete all RSVPs (depends on house memberships and events)
          await tx.rSVP.deleteMany({
            where: { organizationId: params.orgId }
          })

          // 2. Delete ticket validations (depends on ticket purchases)
          await tx.ticketValidation.deleteMany({
            where: { 
              purchase: { 
                ticket: { organizationId: params.orgId } 
              } 
            }
          })

          // 3. Delete payments for ticket purchases
          await tx.payment.deleteMany({
            where: { ticketPurchase: { organizationId: params.orgId } }
          })

          // 4. Delete ticket purchases
          await tx.ticketPurchase.deleteMany({
            where: { organizationId: params.orgId }
          })

          // 5. Delete tickets
          await tx.ticket.deleteMany({
            where: { organizationId: params.orgId }
          })

          // 6. Delete events (RSVPs already deleted)
          await tx.event.deleteMany({
            where: { organizationId: params.orgId }
          })

          // 7. Delete member messages
          await tx.memberMessage.deleteMany({
            where: { organizationId: params.orgId }
          })

          // 8. Delete member activities
          await tx.memberActivity.deleteMany({
            where: { houseMembership: { house: { organizationId: params.orgId } } }
          })

          // 9. Delete member dashboards
          await tx.memberDashboard.deleteMany({
            where: { house: { organizationId: params.orgId } }
          })

          // 10. Delete member profiles
          await tx.memberProfile.deleteMany({
            where: { house: { organizationId: params.orgId } }
          })

          // 11. Delete cancellation requests
          await tx.cancellationRequest.deleteMany({
            where: { membershipItem: { organizationId: params.orgId } }
          })

          // 12. Delete membership items
          await tx.membershipItem.deleteMany({
            where: { organizationId: params.orgId }
          })

          // 13. Delete payments for membership applications
          await tx.payment.deleteMany({
            where: { membershipApplication: { organizationId: params.orgId } }
          })

          // 14. Delete membership applications
          await tx.membershipApplication.deleteMany({
            where: { organizationId: params.orgId }
          })

          // 15. Delete form submissions
          await tx.formSubmission.deleteMany({
            where: { form: { organizationId: params.orgId } }
          })

          // 16. Delete custom forms
          await tx.customForm.deleteMany({
            where: { organizationId: params.orgId }
          })

          // 17. Delete communications
          await tx.communication.deleteMany({
            where: { organizationId: params.orgId }
          })

          // 18. Delete reports
          await tx.report.deleteMany({
            where: { organizationId: params.orgId }
          })

          // 19. Delete invoices
          await tx.invoice.deleteMany({
            where: { organizationId: params.orgId }
          })

          // 20. Delete plan prices
          await tx.planPrice.deleteMany({
            where: { membershipPlan: { organizationId: params.orgId } }
          })

          // 21. Delete membership plans
          await tx.membershipPlan.deleteMany({
            where: { organizationId: params.orgId }
          })

          // 22. Delete member portals
          await tx.memberPortal.deleteMany({
            where: { organizationId: params.orgId }
          })

          // 23. NOW delete house memberships (RSVPs already deleted)
          await tx.houseMembership.deleteMany({
            where: { house: { organizationId: params.orgId } }
          })

          // 24. Delete houses
          await tx.house.deleteMany({
            where: { organizationId: params.orgId }
          })

          // 25. Delete memberships
          await tx.membership.deleteMany({
            where: { organizationId: params.orgId }
          })

          // 26. Delete audit logs
          await tx.auditLog.deleteMany({
            where: { organizationId: params.orgId }
          })

          // 27. Finally delete the organization
          await tx.organization.delete({
            where: { id: params.orgId }
          })
        },
        {
          timeout: 60000, // 60 seconds timeout for large deletions
        }
      )

      // Create final audit log (outside transaction since org is deleted)
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          userEmail: session.user.email || '',
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
          userEmail: session.user.email || '',
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