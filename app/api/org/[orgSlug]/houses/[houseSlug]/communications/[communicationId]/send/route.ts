// app/api/org/[orgSlug]/houses/[houseSlug]/communications/[communicationId]/send/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email/send'

export async function POST(
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
        house: {
          include: {
            members: {
              where: { status: 'ACTIVE' },
              include: {
                membership: {
                  include: {
                    user: {
                      select: { email: true, name: true }
                    }
                  }
                }
              }
            }
          }
        }
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
        { error: 'Communication already sent or sending' },
        { status: 400 }
      )
    }

    // Update status to sending
    await prisma.communication.update({
      where: { id: communication.id },
      data: { status: 'SENDING' }
    })

    // Get recipients based on recipient type
    let recipients: { email: string; name: string | null }[] = []
    
    if (communication.recipientType === 'ALL_MEMBERS' || communication.recipientType === 'HOUSE_MEMBERS') {
      recipients = communication.house?.members.map(m => ({
        email: m.membership.user.email!,
        name: m.membership.user.name
      })) || []
    }

    // Send emails in batches
    const batchSize = 50
    let sentCount = 0

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize)
      
      await Promise.all(
        batch.map(recipient =>
          sendEmail({
            to: recipient.email,
            template: 'announcement',  // Now valid
            data: {
              name: recipient.name || recipient.email.split('@')[0],
              subject: communication.subject,
              body: communication.body,
            }
          }).catch(err => {
            console.error(`Failed to send to ${recipient.email}:`, err)
            return null
          })
        )
      )
      
      sentCount += batch.length
      
      // Update progress
      await prisma.communication.update({
        where: { id: communication.id },
        data: { sentCount }
      })
    }

    // Mark as sent
    await prisma.communication.update({
      where: { id: communication.id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        sentCount
      }
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: 'COMMUNICATION_SENT',
        entityType: 'COMMUNICATION',
        entityId: communication.id,
        organizationId: communication.organizationId,
        houseId: communication.houseId,
        metadata: { sentCount, subject: communication.subject }
      }
    })

    return NextResponse.json({
      success: true,
      sentCount,
      message: `Communication sent to ${sentCount} recipients`
    })
  } catch (error) {
    // Revert status on error
    await prisma.communication.update({
      where: { id: params.communicationId },
      data: { status: 'FAILED' }
    }).catch(() => {})

    console.error('Send communication error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}