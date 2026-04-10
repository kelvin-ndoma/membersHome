// app/api/org/[orgSlug]/houses/[houseSlug]/tickets/route.ts
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
      select: { id: true, organizationId: true }
    })

    if (!house) {
      return NextResponse.json(
        { error: 'House not found' },
        { status: 404 }
      )
    }

    const tickets = await prisma.ticket.findMany({
      where: {
        OR: [
          { houseId: house.id },
          { organizationId: house.organizationId, houseId: null }
        ],
        status: 'ACTIVE'
      },
      include: {
        _count: {
          select: { purchases: true }
        },
        event: {
          select: { id: true, title: true, startDate: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ tickets })
  } catch (error) {
    console.error('Get tickets error:', error)
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

    const data = await req.json()

    if (!data.name || data.price === undefined || !data.totalQuantity) {
      return NextResponse.json(
        { error: 'Name, price, and quantity are required' },
        { status: 400 }
      )
    }

    if (!data.eventId) {
      return NextResponse.json(
        { error: 'Event is required' },
        { status: 400 }
      )
    }

    // Build the data object conditionally
    const ticketData: any = {
      name: data.name,
      description: data.description || undefined,
      type: data.type || 'GENERAL_ADMISSION',
      price: parseFloat(data.price),
      currency: data.currency || 'USD',
      totalQuantity: parseInt(data.totalQuantity),
      soldQuantity: 0,
      maxPerPurchase: data.maxPerPurchase ? parseInt(data.maxPerPurchase) : 10,
      memberOnly: data.memberOnly || false,
      requiresApproval: data.requiresApproval || false,
      salesStartAt: new Date(data.salesStartAt),
      validFrom: new Date(data.validFrom || data.salesStartAt),
      status: data.status || 'DRAFT',
      organizationId: house.organizationId,
      houseId: house.id,
      eventId: data.eventId,
      createdBy: session.user.id,
    }

    // Only add optional date fields if they have values
    if (data.salesEndAt) {
      ticketData.salesEndAt = new Date(data.salesEndAt)
    }
    if (data.validUntil) {
      ticketData.validUntil = new Date(data.validUntil)
    }

    const ticket = await prisma.ticket.create({
      data: ticketData
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email || '',
        action: 'TICKET_CREATED',
        entityType: 'TICKET',
        entityId: ticket.id,
        organizationId: house.organizationId,
        houseId: house.id,
        metadata: { name: data.name, price: data.price, totalQuantity: data.totalQuantity }
      }
    })

    return NextResponse.json({
      success: true,
      ticket
    }, { status: 201 })
  } catch (error) {
    console.error('Create ticket error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}