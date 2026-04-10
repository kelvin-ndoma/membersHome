// app/api/org/[orgSlug]/houses/[houseSlug]/forms/[formSlug]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string; formSlug: string } }
) {
  try {
    const form = await prisma.customForm.findFirst({
      where: {
        slug: params.formSlug,
        house: {
          slug: params.houseSlug,
          organization: { slug: params.orgSlug }
        }
      },
      include: {
        _count: {
          select: { submissions: true }
        }
      }
    })

    if (!form) {
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ form })
  } catch (error) {
    console.error('Get form error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
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
        { error: 'Cannot edit published form' },
        { status: 400 }
      )
    }

    const updates = await req.json()
    delete updates.id
    delete updates.slug
    delete updates.status
    delete updates.organizationId
    delete updates.houseId

    const updatedForm = await prisma.customForm.update({
      where: { id: form.id },
      data: updates
    })

    return NextResponse.json({ form: updatedForm })
  } catch (error) {
    console.error('Update form error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    await prisma.$transaction(async (tx) => {
      await tx.formSubmission.deleteMany({ where: { formId: form.id } })
      await tx.customForm.delete({ where: { id: form.id } })
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: 'FORM_DELETED',
        entityType: 'CUSTOM_FORM',
        entityId: form.id,
        organizationId: form.organizationId,
        houseId: form.houseId,
        metadata: { title: form.title }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete form error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}