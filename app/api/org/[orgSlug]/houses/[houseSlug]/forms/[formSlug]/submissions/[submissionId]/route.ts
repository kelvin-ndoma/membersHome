// app/api/org/[orgSlug]/houses/[houseSlug]/forms/[formSlug]/submissions/[submissionId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string; formSlug: string; submissionId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const submission = await prisma.formSubmission.findFirst({
      where: {
        id: params.submissionId,
        form: {
          slug: params.formSlug,
          house: {
            slug: params.houseSlug,
            organization: { slug: params.orgSlug }
          }
        }
      },
      include: {
        form: true,
        reviewer: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ submission })
  } catch (error) {
    console.error('Get submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string; formSlug: string; submissionId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { status, notes } = await req.json()

    // Include form in the query
    const submission = await prisma.formSubmission.findFirst({
      where: {
        id: params.submissionId,
        form: {
          slug: params.formSlug,
          house: {
            slug: params.houseSlug,
            organization: { slug: params.orgSlug }
          }
        }
      },
      include: {
        form: true  // Include form to access organizationId and houseId
      }
    })

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    const updatedSubmission = await prisma.formSubmission.update({
      where: { id: submission.id },
      data: {
        status: status || submission.status,
        notes,
        reviewedAt: new Date(),
        reviewedBy: session.user.id
      }
    })

    // Now submission.form is available
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email || '',
        action: 'SUBMISSION_UPDATED',
        entityType: 'FORM_SUBMISSION',
        entityId: submission.id,
        organizationId: submission.form.organizationId,
        houseId: submission.form.houseId,
        metadata: { status, notes }
      }
    })

    return NextResponse.json({ submission: updatedSubmission })
  } catch (error) {
    console.error('Update submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string; formSlug: string; submissionId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const submission = await prisma.formSubmission.findFirst({
      where: {
        id: params.submissionId,
        form: {
          slug: params.formSlug,
          house: {
            slug: params.houseSlug,
            organization: { slug: params.orgSlug }
          }
        }
      },
      include: { form: true }
    })

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    await prisma.formSubmission.delete({
      where: { id: submission.id }
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email || '',
        action: 'SUBMISSION_DELETED',
        entityType: 'FORM_SUBMISSION',
        entityId: submission.id,
        organizationId: submission.form.organizationId,
        houseId: submission.form.houseId,
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}