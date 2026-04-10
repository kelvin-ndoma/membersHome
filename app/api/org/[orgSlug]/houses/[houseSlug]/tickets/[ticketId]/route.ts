// app/api/org/[orgSlug]/houses/[houseSlug]/tickets/[ticketId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string; ticketId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ticket = await prisma.ticket.findFirst({
      where: {
        id: params.ticketId,
        OR: [
          { house: { slug: params.houseSlug, organization: { slug: params.orgSlug } } },
          { organization: { slug: params.orgSlug }, houseId: null }
        ]
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            location: true,
            status: true,
          }
        },
        house: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        },
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        },
        _count: {
          select: {
            purchases: true,
          }
        }
      }
    })

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ ticket })
  } catch (error) {
    console.error('Get ticket error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string; ticketId: string } }
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

    // Check if user is org admin as fallback
    const isOrgAdmin = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organization: { slug: params.orgSlug },
        role: { in: ['ORG_OWNER', 'ORG_ADMIN'] }
      }
    })

    if (house.members.length === 0 && !isOrgAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const ticket = await prisma.ticket.findFirst({
      where: {
        id: params.ticketId,
        OR: [
          { houseId: house.id },
          { organizationId: house.organizationId, houseId: null }
        ]
      }
    })

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      )
    }

    const updates = await req.json()

    // Build update data conditionally
    const updateData: any = {}
    
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.type !== undefined) updateData.type = updates.type
    if (updates.price !== undefined) updateData.price = parseFloat(updates.price)
    if (updates.currency !== undefined) updateData.currency = updates.currency
    if (updates.totalQuantity !== undefined) updateData.totalQuantity = parseInt(updates.totalQuantity)
    if (updates.maxPerPurchase !== undefined) updateData.maxPerPurchase = parseInt(updates.maxPerPurchase)
    if (updates.memberOnly !== undefined) updateData.memberOnly = updates.memberOnly
    if (updates.requiresApproval !== undefined) updateData.requiresApproval = updates.requiresApproval
    if (updates.status !== undefined) updateData.status = updates.status
    if (updates.salesStartAt) updateData.salesStartAt = new Date(updates.salesStartAt)
    if (updates.salesEndAt) updateData.salesEndAt = new Date(updates.salesEndAt)
    if (updates.validFrom) updateData.validFrom = new Date(updates.validFrom)
    if (updates.validUntil) updateData.validUntil = new Date(updates.validUntil)

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: updateData
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email || '',
        action: 'TICKET_UPDATED',
        entityType: 'TICKET',
        entityId: ticket.id,
        organizationId: house.organizationId,
        houseId: house.id,
        metadata: { updates }
      }
    })

    return NextResponse.json({
      success: true,
      ticket: updatedTicket
    })
  } catch (error) {
    console.error('Update ticket error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string; ticketId: string } }
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

    const isOrgAdmin = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organization: { slug: params.orgSlug },
        role: { in: ['ORG_OWNER', 'ORG_ADMIN'] }
      }
    })

    if (house.members.length === 0 && !isOrgAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const ticket = await prisma.ticket.findFirst({
      where: {
        id: params.ticketId,
        OR: [
          { houseId: house.id },
          { organizationId: house.organizationId, houseId: null }
        ]
      },
      include: {
        _count: {
          select: { purchases: true }
        }
      }
    })

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      )
    }

    // Don't allow deletion if there are purchases
    if (ticket._count.purchases > 0) {
      return NextResponse.json(
        { error: 'Cannot delete ticket with purchases. Cancel it instead.' },
        { status: 400 }
      )
    }

    await prisma.ticket.delete({
      where: { id: ticket.id }
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email || '',
        action: 'TICKET_DELETED',
        entityType: 'TICKET',
        entityId: ticket.id,
        organizationId: house.organizationId,
        houseId: house.id,
        metadata: { ticketName: ticket.name }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Ticket deleted successfully'
    })
  } catch (error) {
    console.error('Delete ticket error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}