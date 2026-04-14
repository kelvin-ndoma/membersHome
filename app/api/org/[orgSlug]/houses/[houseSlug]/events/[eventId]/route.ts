// app/api/org/[orgSlug]/houses/[houseSlug]/events/[eventId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string; eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const event = await prisma.event.findFirst({
      where: {
        id: params.eventId,
        organization: { slug: params.orgSlug }
      },
      include: {
        _count: {
          select: { rsvps: true }
        },
        rsvps: {
          where: {
            houseMembership: {
              membership: { userId: session.user.id }
            }
          },
          select: {
            id: true,
            status: true,
            guestsCount: true,
            checkedInAt: true,
          }
        },
        creator: {
          select: { id: true, name: true, email: true }
        },
        house: {
          select: { id: true, name: true, slug: true }
        },
        tickets: {
          where: { status: 'ACTIVE' },
          include: {
            _count: { select: { purchases: true } }
          }
        }
      }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      event: {
        ...event,
        userRsvp: event.rsvps[0] || null,
      }
    })
  } catch (error) {
    console.error('Get event error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string; eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const event = await prisma.event.findFirst({
      where: {
        id: params.eventId,
        organization: { slug: params.orgSlug }
      }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Check if user can edit (creator or house manager)
    const canEdit = event.createdBy === session.user.id || 
      await prisma.houseMembership.findFirst({
        where: {
          houseId: event.houseId!,
          membership: { userId: session.user.id },
          role: { in: ['HOUSE_MANAGER', 'HOUSE_ADMIN'] }
        }
      })

    if (!canEdit) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const updates = await req.json()
    
    // Prevent changing certain fields
    delete updates.slug
    delete updates.id
    delete updates.organizationId
    delete updates.houseId
    delete updates.createdBy

    // Build update data
    const updateData: any = { ...updates }

    // Handle date conversions
    if (updates.startDate) {
      updateData.startDate = new Date(updates.startDate)
    }
    if (updates.endDate) {
      updateData.endDate = new Date(updates.endDate)
    }

    // Validate dates if both are being updated
    const startDate = updateData.startDate || event.startDate
    const endDate = updateData.endDate || event.endDate
    
    if (endDate && new Date(endDate) <= new Date(startDate)) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      )
    }

    // Handle status change to PUBLISHED
    if (updates.status === 'PUBLISHED' && event.status !== 'PUBLISHED') {
      updateData.publishedAt = new Date()
    }

    // Handle address JSON
    if (updates.address) {
      try {
        updateData.address = JSON.parse(updates.address)
      } catch {
        // Ignore parsing errors
      }
    }

    // Handle settings - merge with existing settings
    if (updates.settings) {
      const currentSettings = (event.settings as any) || {}
      updateData.settings = {
        ...currentSettings,
        ...updates.settings,
      }
    }

    const updatedEvent = await prisma.event.update({
      where: { id: event.id },
      data: updateData
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email || '',
        action: 'EVENT_UPDATED',
        entityType: 'EVENT',
        entityId: event.id,
        organizationId: event.organizationId,
        houseId: event.houseId,
        metadata: { updates: Object.keys(updates) }
      }
    })

    return NextResponse.json({ event: updatedEvent })
  } catch (error) {
    console.error('Update event error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string; eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const event = await prisma.event.findFirst({
      where: {
        id: params.eventId,
        organization: { slug: params.orgSlug }
      },
      include: {
        tickets: {
          include: {
            purchases: true
          }
        }
      }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Check permissions
    const canDelete = event.createdBy === session.user.id ||
      await prisma.houseMembership.findFirst({
        where: {
          houseId: event.houseId!,
          membership: { userId: session.user.id },
          role: { in: ['HOUSE_MANAGER', 'HOUSE_ADMIN'] }
        }
      })

    if (!canDelete) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Check if event has ticket sales
    const hasSales = event.tickets.some(ticket => ticket.soldQuantity > 0)
    if (hasSales) {
      return NextResponse.json(
        { error: 'Cannot delete event with ticket sales. Cancel it instead.' },
        { status: 400 }
      )
    }

    await prisma.$transaction(async (tx) => {
      // Delete ticket validations
      for (const ticket of event.tickets) {
        await tx.ticketValidation.deleteMany({
          where: { purchase: { ticketId: ticket.id } }
        })
      }
      
      // Delete ticket purchases
      for (const ticket of event.tickets) {
        await tx.ticketPurchase.deleteMany({
          where: { ticketId: ticket.id }
        })
      }
      
      // Delete tickets
      await tx.ticket.deleteMany({
        where: { eventId: event.id }
      })
      
      // Delete RSVPs
      await tx.rSVP.deleteMany({ where: { eventId: event.id } })
      
      // Delete event
      await tx.event.delete({ where: { id: event.id } })
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email || '',
        action: 'EVENT_DELETED',
        entityType: 'EVENT',
        entityId: event.id,
        organizationId: event.organizationId,
        houseId: event.houseId,
        metadata: { title: event.title }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete event error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}