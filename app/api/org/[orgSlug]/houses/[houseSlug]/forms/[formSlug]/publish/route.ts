// app/api/org/[orgSlug]/houses/[houseSlug]/forms/[formSlug]/publish/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string; formSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const form = await prisma.customForm.findFirst({
      where: {
        slug: params.formSlug,
        house: {
          slug: params.houseSlug,
          organization: { slug: params.orgSlug }
        }
      }
    })

    if (!form) {
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
      )
    }

    if (form.status === 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Form already published' },
        { status: 400 }
      )
    }

    const updatedForm = await prisma.customForm.update({
      where: { id: form.id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date()
      }
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: 'FORM_PUBLISHED',
        entityType: 'CUSTOM_FORM',
        entityId: form.id,
        organizationId: form.organizationId,
        houseId: form.houseId,
        metadata: { title: form.title }
      }
    })

    return NextResponse.json({
      success: true,
      form: updatedForm,
      publicUrl: `${process.env.NEXT_PUBLIC_APP_URL}/forms/${form.slug}`
    })
  } catch (error) {
    console.error('Publish form error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}