// app/api/org/[orgSlug]/houses/[houseSlug]/applications/[applicationId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email/send'
import crypto from 'crypto'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string; applicationId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updates = await req.json()
    const { status, notes, rejectionReason, sendCardCollectionEmail } = updates

    // Get the application
    const application = await prisma.membershipApplication.findFirst({
      where: {
        id: params.applicationId,
        house: {
          slug: params.houseSlug,
          organization: { slug: params.orgSlug }
        }
      },
      include: {
        house: {
          include: {
            organization: true,
          }
        },
        membershipPlan: true,
        selectedPrice: true,
      }
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {
      status,
      reviewedBy: session.user.id,
      reviewedAt: new Date(),
    }

    if (status === 'REVIEWING') {
      updateData.movedToReviewingAt = new Date()
    }

    if (status === 'APPROVED') {
      updateData.approvedAt = new Date()
    }

    if (status === 'REJECTED') {
      updateData.rejectedAt = new Date()
      updateData.rejectionReason = rejectionReason
    }

    if (notes) {
      updateData.notes = notes
    }

    // Update the application
    const updatedApplication = await prisma.membershipApplication.update({
      where: { id: application.id },
      data: updateData
    })

    // TRIGGER EMAILS based on status
    if (status === 'REVIEWING' && sendCardCollectionEmail) {
      // Generate a secure token for card collection
      const cardToken = crypto.randomBytes(32).toString('hex')
      
      await prisma.membershipApplication.update({
        where: { id: application.id },
        data: {
          reviewToken: cardToken,
          reviewTokenSentAt: new Date(),
          reviewTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        }
      })

      // Send card collection email
      const cardCollectionUrl = `${process.env.NEXT_PUBLIC_APP_URL}/applications/${application.id}/add-card?token=${cardToken}`
      
      await sendEmail({
        to: application.email,
        template: 'card-collection',
        data: {
          name: application.firstName,
          organizationName: application.house.organization.name,
          houseName: application.house.name,
          planName: application.membershipPlan?.name || 'Selected Plan',
          amount: application.selectedPrice 
            ? `${application.selectedPrice.currency} ${application.selectedPrice.amount}/${application.selectedPrice.billingFrequency.toLowerCase()}`
            : 'TBD',
          setupUrl: cardCollectionUrl,
        }
      })
    }

    if (status === 'APPROVED') {
      // Send welcome/setup email
      const setupUrl = `${process.env.NEXT_PUBLIC_APP_URL}/applications/${application.id}/set-password`
      
      await sendEmail({
        to: application.email,
        template: 'application-approved',
        data: {
          name: application.firstName,
          organizationName: application.house.organization.name,
          houseName: application.house.name,
          setupUrl,
        }
      })
    }

    if (status === 'REJECTED') {
      // Send rejection email
      await sendEmail({
        to: application.email,
        template: 'application-rejected',
        data: {
          name: application.firstName,
          organizationName: application.house.organization.name,
          houseName: application.house.name,
          reason: rejectionReason,
        }
      })
    }

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email || '',
        action: `APPLICATION_${status}`,
        entityType: 'MEMBERSHIP_APPLICATION',
        entityId: application.id,
        organizationId: application.organizationId,
        houseId: application.houseId,
        metadata: { previousStatus: application.status, newStatus: status }
      }
    })

    return NextResponse.json({ success: true, application: updatedApplication })
  } catch (error) {
    console.error('Update application error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}