// app/api/org/[orgSlug]/houses/[houseSlug]/applications/[applicationId]/reject/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email/send'

export async function POST(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string; applicationId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reason } = await req.json()

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
          include: { organization: true }
        }
      }
    })

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    if (application.status === 'APPROVED') {
      return NextResponse.json(
        { error: 'Cannot reject an approved application' },
        { status: 400 }
      )
    }

    const updatedApplication = await prisma.membershipApplication.update({
      where: { id: application.id },
      data: {
        status: 'REJECTED',
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        rejectedAt: new Date(),
        rejectionReason: reason
      }
    })

    // Send rejection email - using correct template
    await sendEmail({
      to: application.email,
      template: 'application-rejected',  // Now valid
      data: {
        name: `${application.firstName} ${application.lastName}`,
        organizationName: application.house.organization.name,
        houseName: application.house.name,
        reason: reason || 'Your application was not accepted at this time.',
      }
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: 'APPLICATION_REJECTED',
        entityType: 'MEMBERSHIP_APPLICATION',
        entityId: application.id,
        organizationId: application.organizationId,
        houseId: application.houseId,
        metadata: { reason }
      }
    })

    return NextResponse.json({
      success: true,
      application: updatedApplication
    })
  } catch (error) {
    console.error('Reject application error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}