// app/api/platform/organizations/[orgId]/houses/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email/send'
import crypto from 'crypto'

export async function GET(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.platformRole !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const houses = await prisma.house.findMany({
      where: { organizationId: params.orgId },
      include: {
        _count: {
          select: {
            members: true,
            events: true
          }
        },
        members: {
          where: { role: 'HOUSE_MANAGER' },
          include: {
            membership: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ houses })
  } catch (error) {
    console.error('Get houses error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.platformRole !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { 
      name, 
      slug, 
      description, 
      managerEmail,
      managerName,
      isPrivate 
    } = await req.json()

    if (!name || !slug || !managerEmail) {
      return NextResponse.json(
        { error: 'Name, slug, and manager email are required' },
        { status: 400 }
      )
    }

    // Check if house slug is unique within organization
    const existingHouse = await prisma.house.findFirst({
      where: {
        organizationId: params.orgId,
        slug
      }
    })

    if (existingHouse) {
      return NextResponse.json(
        { error: 'House slug already exists in this organization' },
        { status: 400 }
      )
    }

    // Find or create manager user
    let managerUser = await prisma.user.findUnique({
      where: { email: managerEmail }
    })

    const setupToken = crypto.randomBytes(32).toString('hex')

    if (!managerUser) {
      managerUser = await prisma.user.create({
        data: {
          email: managerEmail,
          name: managerName || managerEmail.split('@')[0],
          invitationToken: setupToken,
          invitationSentAt: new Date(),
        }
      })
    } else {
      managerUser = await prisma.user.update({
        where: { id: managerUser.id },
        data: {
          invitationToken: setupToken,
          invitationSentAt: new Date(),
        }
      })
    }

    // Get or create membership for manager
    let membership = await prisma.membership.findFirst({
      where: {
        userId: managerUser.id,
        organizationId: params.orgId
      }
    })

    if (!membership) {
      membership = await prisma.membership.create({
        data: {
          userId: managerUser.id,
          organizationId: params.orgId,
          role: 'MEMBER',
          status: 'ACTIVE',
        }
      })
    }

    // Create the house
    const house = await prisma.house.create({
      data: {
        name,
        slug,
        description,
        organizationId: params.orgId,
        isPrivate: isPrivate || false,
      }
    })

    // Create house membership for manager
    const houseMembership = await prisma.houseMembership.create({
      data: {
        houseId: house.id,
        membershipId: membership.id,
        role: 'HOUSE_MANAGER',
        status: 'ACTIVE',
        acceptanceToken: setupToken,
        acceptanceTokenSentAt: new Date(),
      }
    })

    // Send setup email to manager
    const setupUrl = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invite?token=${setupToken}&type=house-manager&houseId=${house.id}`
    const organization = await prisma.organization.findUnique({
      where: { id: params.orgId },
      select: { name: true }
    })

    await sendEmail({
      to: managerEmail,
      template: 'invitation',
      data: {
        name: managerUser.name || managerEmail.split('@')[0],
        organizationName: organization?.name,
        houseName: name,
        setupUrl,
        role: 'House Manager'
      }
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: 'HOUSE_CREATED',
        entityType: 'HOUSE',
        entityId: house.id,
        organizationId: params.orgId,
        metadata: {
          houseName: name,
          managerEmail
        }
      }
    })

    return NextResponse.json({
      success: true,
      house,
      message: 'House created and manager notified'
    }, { status: 201 })
  } catch (error) {
    console.error('Create house error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}