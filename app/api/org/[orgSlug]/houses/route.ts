// app/api/org/[orgSlug]/houses/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email/send'
import crypto from 'crypto'

export async function GET(
  req: NextRequest,
  { params }: { params: { orgSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organization = await prisma.organization.findUnique({
      where: { slug: params.orgSlug },
      select: { id: true }
    })

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Check user membership
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organizationId: organization.id,
      }
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const houses = await prisma.house.findMany({
      where: { organizationId: organization.id },
      include: {
        _count: {
          select: {
            members: true,
            events: true,
          }
        },
        members: {
          where: {
            membership: {
              userId: session.user.id
            }
          },
          select: {
            role: true,
            status: true,
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
  { params }: { params: { orgSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organization = await prisma.organization.findUnique({
      where: { slug: params.orgSlug }
    })

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Check if user is org admin/owner
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organizationId: organization.id,
        role: { in: ['ORG_OWNER', 'ORG_ADMIN'] }
      }
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const { name, slug, description, managerEmail, managerName, isPrivate } = await req.json()

    if (!name || !slug || !managerEmail) {
      return NextResponse.json(
        { error: 'Name, slug, and manager email are required' },
        { status: 400 }
      )
    }

    // Check if slug is unique within org
    const existingHouse = await prisma.house.findFirst({
      where: {
        organizationId: organization.id,
        slug
      }
    })

    if (existingHouse) {
      return NextResponse.json(
        { error: 'House slug already exists in this organization' },
        { status: 400 }
      )
    }

    // Find or create manager
    let manager = await prisma.user.findUnique({
      where: { email: managerEmail }
    })

    const inviteToken = crypto.randomBytes(32).toString('hex')

    if (!manager) {
      manager = await prisma.user.create({
        data: {
          email: managerEmail,
          name: managerName || managerEmail.split('@')[0],
          invitationToken: inviteToken,
          invitationSentAt: new Date(),
        }
      })
    }

    // Get or create org membership for manager
    let managerMembership = await prisma.membership.findFirst({
      where: {
        userId: manager.id,
        organizationId: organization.id
      }
    })

    if (!managerMembership) {
      managerMembership = await prisma.membership.create({
        data: {
          userId: manager.id,
          organizationId: organization.id,
          role: 'MEMBER',
          status: 'ACTIVE',
        }
      })
    }

    // Create house
    const house = await prisma.house.create({
      data: {
        name,
        slug,
        description,
        organizationId: organization.id,
        isPrivate: isPrivate || false,
      }
    })

    // Add manager as house manager
    const houseMembership = await prisma.houseMembership.create({
      data: {
        houseId: house.id,
        membershipId: managerMembership.id,
        role: 'HOUSE_MANAGER',
        status: 'ACTIVE',
        acceptanceToken: inviteToken,
        acceptanceTokenSentAt: new Date(),
      }
    })

    // Create member portal
    await prisma.memberPortal.create({
      data: {
        houseId: house.id,
        organizationId: organization.id,
        welcomeMessage: `Welcome to ${name}!`,
      }
    })

    // Send invitation email
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invite?token=${inviteToken}&type=house-manager&houseId=${house.id}`
    
    await sendEmail({
      to: managerEmail,
      template: 'invitation',
      data: {
        name: manager.name || managerEmail.split('@')[0],
        organizationName: organization.name,
        houseName: name,
        setupUrl: inviteUrl,
        role: 'House Manager',
      }
    })

    // Log action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: 'HOUSE_CREATED',
        entityType: 'HOUSE',
        entityId: house.id,
        organizationId: organization.id,
        metadata: { houseName: name, managerEmail }
      }
    })

    return NextResponse.json({
      success: true,
      house,
      message: 'House created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Create house error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}