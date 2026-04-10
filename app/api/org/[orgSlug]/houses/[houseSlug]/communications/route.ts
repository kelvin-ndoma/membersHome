// app/api/org/[orgSlug]/houses/[houseSlug]/communications/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email/send'

export async function GET(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const type = searchParams.get('type')
    const status = searchParams.get('status')

    const house = await prisma.house.findFirst({
      where: {
        slug: params.houseSlug,
        organization: { slug: params.orgSlug }
      },
      select: { id: true, organizationId: true }
    })

    if (!house) {
      return NextResponse.json(
        { error: 'House not found' },
        { status: 404 }
      )
    }

    const where: any = {
      OR: [
        { houseId: house.id },
        { organizationId: house.organizationId, houseId: null }
      ]
    }
    if (type) where.type = type
    if (status) where.status = status

    const [communications, total] = await Promise.all([
      prisma.communication.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: {
            select: { id: true, name: true, email: true }
          }
        }
      }),
      prisma.communication.count({ where })
    ])

    return NextResponse.json({
      communications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get communications error:', error)
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
            role: { in: ['HOUSE_MANAGER', 'HOUSE_ADMIN', 'HOUSE_STAFF'] }
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
        { error: 'Unauthorized - Staff access required' },
        { status: 403 }
      )
    }

    const {
      subject,
      body,
      type,
      recipientType,
      segmentFilters,
      scheduledFor,
    } = await req.json()

    if (!subject || !body) {
      return NextResponse.json(
        { error: 'Subject and body are required' },
        { status: 400 }
      )
    }

    const communication = await prisma.communication.create({
      data: {
        subject,
        body,
        type: type || 'EMAIL',
        recipientType: recipientType || 'ALL_MEMBERS',
        segmentFilters: segmentFilters || {},
        status: scheduledFor ? 'SCHEDULED' : 'DRAFT',
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        organizationId: house.organizationId,
        houseId: house.id,
        createdBy: session.user.id,
      }
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: 'COMMUNICATION_CREATED',
        entityType: 'COMMUNICATION',
        entityId: communication.id,
        organizationId: house.organizationId,
        houseId: house.id,
        metadata: { subject, type, recipientType }
      }
    })

    return NextResponse.json({
      success: true,
      communication
    }, { status: 201 })
  } catch (error) {
    console.error('Create communication error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}