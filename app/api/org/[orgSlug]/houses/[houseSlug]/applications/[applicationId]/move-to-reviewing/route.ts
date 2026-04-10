// app/api/org/[orgSlug]/houses/[houseSlug]/applications/[applicationId]/move-to-reviewing/route.ts
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

    if (application.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Application is not pending' },
        { status: 400 }
      )
    }

    const updatedApplication = await prisma.membershipApplication.update({
      where: { id: application.id },
      data: {
        status: 'REVIEWING',
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        movedToReviewingAt: new Date()
      }
    })

    // Send email to applicant
    await sendEmail({
      to: application.email,
      template: 'application-received',
      data: {
        name: `${application.firstName} ${application.lastName}`,
        organizationName: application.house.organization.name,
        houseName: application.house.name,
        applicationId: application.id,
      }
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: 'APPLICATION_MOVED_TO_REVIEWING',
        entityType: 'MEMBERSHIP_APPLICATION',
        entityId: application.id,
        organizationId: application.organizationId,
        houseId: application.houseId,
      }
    })

    return NextResponse.json({
      success: true,
      application: updatedApplication
    })
  } catch (error) {
    console.error('Move to reviewing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}