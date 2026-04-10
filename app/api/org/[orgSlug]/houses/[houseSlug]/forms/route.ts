// app/api/org/[orgSlug]/houses/[houseSlug]/forms/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const house = await prisma.house.findFirst({
      where: {
        slug: params.houseSlug,
        organization: { slug: params.orgSlug }
      },
      select: { id: true }
    })

    if (!house) {
      return NextResponse.json(
        { error: 'House not found' },
        { status: 404 }
      )
    }

    const forms = await prisma.customForm.findMany({
      where: { houseId: house.id },
      include: {
        _count: {
          select: { submissions: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ forms })
  } catch (error) {
    console.error('Get forms error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const house = await prisma.house.findFirst({
      where: {
        slug: params.houseSlug,
        organization: { slug: params.orgSlug }
      },
      include: {
        members: {
          where: {
            membership: { userId: session.user.id },
            role: { in: ['HOUSE_MANAGER', 'HOUSE_ADMIN'] }
          }
        }
      }
    })

    if (!house) {
      return NextResponse.json(
        { error: 'House not found' },
        { status: 404 }
      )
    }

    if (house.members.length === 0) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const { title, description, slug, fields, settings } = await req.json()

    if (!title || !slug || !fields) {
      return NextResponse.json(
        { error: 'Title, slug, and fields are required' },
        { status: 400 }
      )
    }

    // Check if slug is unique
    const existingForm = await prisma.customForm.findUnique({
      where: { slug }
    })

    if (existingForm) {
      return NextResponse.json(
        { error: 'Form slug already exists' },
        { status: 400 }
      )
    }

    const form = await prisma.customForm.create({
      data: {
        title,
        description,
        slug,
        fields,
        settings: settings || {},
        status: 'DRAFT',
        organizationId: house.organizationId,
        houseId: house.id,
      }
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: 'FORM_CREATED',
        entityType: 'CUSTOM_FORM',
        entityId: form.id,
        organizationId: house.organizationId,
        houseId: house.id,
        metadata: { title, slug }
      }
    })

    return NextResponse.json({
      success: true,
      form
    }, { status: 201 })
  } catch (error) {
    console.error('Create form error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}