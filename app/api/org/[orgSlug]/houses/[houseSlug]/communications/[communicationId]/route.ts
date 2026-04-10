// app/api/org/[orgSlug]/houses/[houseSlug]/communications/[communicationId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string; communicationId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const communication = await prisma.communication.findFirst({
      where: {
        id: params.communicationId,
        organization: { slug: params.orgSlug }
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    if (!communication) {
      return NextResponse.json(
        { error: 'Communication not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ communication })
  } catch (error) {
    console.error('Get communication error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string; communicationId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const communication = await prisma.communication.findFirst({
      where: {
        id: params.communicationId,
        organization: { slug: params.orgSlug }
      }
    })

    if (!communication) {
      return NextResponse.json(
        { error: 'Communication not found' },
        { status: 404 }
      )
    }

    if (communication.status === 'SENT' || communication.status === 'SENDING') {
      return NextResponse.json(
        { error: 'Cannot edit sent or sending communication' },
        { status: 400 }
      )
    }

    const updates = await req.json()
    delete updates.id
    delete updates.sentCount
    delete updates.openedCount
    delete updates.clickedCount

    const updatedCommunication = await prisma.communication.update({
      where: { id: communication.id },
      data: {
        ...updates,
        scheduledFor: updates.scheduledFor ? new Date(updates.scheduledFor) : undefined
      }
    })

    return NextResponse.json({ communication: updatedCommunication })
  } catch (error) {
    console.error('Update communication error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string; communicationId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const communication = await prisma.communication.findFirst({
      where: {
        id: params.communicationId,
        organization: { slug: params.orgSlug }
      }
    })

    if (!communication) {
      return NextResponse.json(
        { error: 'Communication not found' },
        { status: 404 }
      )
    }

    if (communication.status === 'SENDING') {
      return NextResponse.json(
        { error: 'Cannot delete while sending' },
        { status: 400 }
      )
    }

    await prisma.communication.delete({
      where: { id: communication.id }
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: 'COMMUNICATION_DELETED',
        entityType: 'COMMUNICATION',
        entityId: communication.id,
        organizationId: communication.organizationId,
        houseId: communication.houseId,
        metadata: { subject: communication.subject }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete communication error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}