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
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const search = searchParams.get('search')

    const house = await prisma.house.findFirst({
      where: {
        slug: params.houseSlug,
        organization: { slug: params.orgSlug }
      }
    })

    if (!house) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

    const where: any = {
      OR: [
        { houseId: house.id },
        { organizationId: house.organizationId, houseId: null }
      ]
    }

    if (status) where.status = status
    if (type) where.type = type
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { body: { contains: search, mode: 'insensitive' } },
      ]
    }

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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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
        organization: true,
        members: {
          where: { status: 'ACTIVE' },
          include: {
            membership: {
              include: {
                user: {
                  select: { id: true, email: true, name: true }
                }
              }
            }
          }
        }
      }
    })

    if (!house) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

    const data = await req.json()
    const { subject, body, type, recipientType, scheduledFor, status } = data

    if (!subject || !body || !type || !recipientType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create communication record
    const communication = await prisma.communication.create({
      data: {
        subject,
        body,
        type,
        recipientType,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        status: status || 'DRAFT',
        organizationId: house.organizationId,
        houseId: house.id,
        createdBy: session.user.id,
      }
    })

    // If status is SCHEDULED and no scheduledFor, send immediately
    if (status === 'SCHEDULED' && !scheduledFor) {
      // Start sending in background
      sendCommunication(communication.id, house.id)
    }

    return NextResponse.json({ success: true, communication }, { status: 201 })
  } catch (error) {
    console.error('Create communication error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function sendCommunication(communicationId: string, houseId: string) {
  try {
    const communication = await prisma.communication.findUnique({
      where: { id: communicationId },
      include: {
        house: {
          include: {
            members: {
              where: { status: 'ACTIVE' },
              include: {
                membership: {
                  include: {
                    user: { select: { email: true, name: true } }
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!communication) return

    // Update status to SENDING
    await prisma.communication.update({
      where: { id: communicationId },
      data: { status: 'SENDING' }
    })

    const members = communication.house?.members || []
    let sentCount = 0

    // Send to each member
    for (const member of members) {
      try {
        const user = member.membership.user
        
        // Replace variables in subject and body
        let personalizedSubject = communication.subject
          .replace(/{{memberName}}/g, user.name || 'Member')
          .replace(/{{houseName}}/g, communication.house?.name || '')
        
        let personalizedBody = communication.body
          .replace(/{{memberName}}/g, user.name || 'Member')
          .replace(/{{memberEmail}}/g, user.email || '')
          .replace(/{{houseName}}/g, communication.house?.name || '')
          .replace(/{{portalUrl}}/g, `${process.env.NEXT_PUBLIC_APP_URL}/portal/${communication.house?.slug}/dashboard`)

        await sendEmail({
          to: user.email!,
          template: 'announcement',
          data: {
            name: user.name || 'Member',
            subject: personalizedSubject,
            body: personalizedBody,
          },
        })

        sentCount++
        
        // Update progress
        await prisma.communication.update({
          where: { id: communicationId },
          data: { sentCount }
        })
      } catch (error) {
        console.error(`Failed to send to member:`, error)
      }
    }

    // Mark as sent
    await prisma.communication.update({
      where: { id: communicationId },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        sentCount
      }
    })

  } catch (error) {
    console.error('Send communication error:', error)
    
    // Mark as failed
    await prisma.communication.update({
      where: { id: communicationId },
      data: { status: 'FAILED' }
    })
  }
}