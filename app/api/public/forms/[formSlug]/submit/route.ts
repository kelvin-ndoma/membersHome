// app/api/public/forms/[formSlug]/submit/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email/send'

export async function POST(
  req: NextRequest,
  { params }: { params: { formSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const data = await req.json()

    const form = await prisma.customForm.findUnique({
      where: { 
        slug: params.formSlug,
        status: 'PUBLISHED'
      },
      include: {
        house: {
          include: {
            organization: true,
          }
        }
      }
    })

    if (!form) {
      return NextResponse.json(
        { error: 'Form not found or not published' },
        { status: 404 }
      )
    }

    // Check if login is required
    const settings = form.settings as any
    if (settings?.requireLogin && !session) {
      return NextResponse.json(
        { error: 'You must be logged in to submit this form' },
        { status: 401 }
      )
    }

    // Check for multiple submissions
    if (!settings?.allowMultipleSubmissions && session) {
      const existingSubmission = await prisma.formSubmission.findFirst({
        where: {
          formId: form.id,
          userId: session.user.id
        }
      })

      if (existingSubmission) {
        return NextResponse.json(
          { error: 'You have already submitted this form' },
          { status: 400 }
        )
      }
    }

    // Create submission
    const submission = await prisma.formSubmission.create({
      data: {
        formId: form.id,
        data,
        userId: session?.user?.id || null,
        userEmail: session?.user?.email || data.email || null,
        status: 'PENDING'
      }
    })

    // Send email notification if configured
    if (settings?.sendEmailNotifications && settings?.notificationEmails) {
      const emails = settings.notificationEmails.split(',').map((e: string) => e.trim())
      
      for (const email of emails) {
        try {
          await sendEmail({
            to: email,
            template: 'form-submission',
            data: {
              formTitle: form.title,
              subject: `New Form Submission: ${form.title}`,
              name: 'Admin',
              houseName: form.house?.name || 'N/A',
              organizationName: form.house?.organization.name || 'N/A',
              submittedAt: new Date().toLocaleString(),
              submissionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/org/${form.house?.organization.slug}/houses/${form.house?.slug}/forms/${form.slug}/submissions/${submission.id}`,
              body: `
                <h2>New Form Submission</h2>
                <p><strong>Form:</strong> ${form.title}</p>
                <p><strong>House:</strong> ${form.house?.name || 'N/A'}</p>
                <p><strong>Organization:</strong> ${form.house?.organization.name || 'N/A'}</p>
                <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
                <h3>Submission Data:</h3>
                <pre style="background: #f3f4f6; padding: 12px; border-radius: 8px; overflow: auto;">${JSON.stringify(data, null, 2)}</pre>
                <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/org/${form.house?.organization.slug}/houses/${form.house?.slug}/forms/${form.slug}/submissions/${submission.id}" style="display: inline-block; padding: 10px 20px; background: #3B82F6; color: white; text-decoration: none; border-radius: 6px;">
                  View Full Submission
                </a></p>
              `,
            }
          })
        } catch (err) {
          console.error('Failed to send notification:', err)
        }
      }
    }

    // Log submission
    await prisma.auditLog.create({
      data: {
        userId: session?.user?.id || null,
        userEmail: session?.user?.email || data.email || 'anonymous',
        action: 'FORM_SUBMITTED',
        entityType: 'FORM_SUBMISSION',
        entityId: submission.id,
        organizationId: form.organizationId,
        houseId: form.houseId,
        metadata: { formTitle: form.title }
      }
    })

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      message: settings?.confirmationMessage || 'Thank you for your submission!'
    }, { status: 201 })
  } catch (error) {
    console.error('Form submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}