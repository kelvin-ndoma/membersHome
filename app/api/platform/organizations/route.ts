// app/api/platform/organizations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email/send'
import crypto from 'crypto'
import { PlanType } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.platformRole !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const where: any = {}
    if (status) where.status = status
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { billingEmail: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              memberships: true,
              houses: true,
              events: true
            }
          },
          memberships: {
            where: { role: 'ORG_OWNER' },
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
      }),
      prisma.organization.count({ where })
    ])

    return NextResponse.json({
      organizations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get organizations error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.platformRole !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { 
      name, 
      slug, 
      description, 
      plan, 
      billingEmail, 
      website,
      ownerEmail,
      ownerName,
      defaultHouseName: customHouseName
    } = await req.json()

    console.log('📝 Creating organization:', { name, slug, ownerEmail })

    if (!name || !slug || !ownerEmail) {
      return NextResponse.json(
        { error: 'Name, slug, and owner email are required' },
        { status: 400 }
      )
    }

    const existingOrg = await prisma.organization.findUnique({
      where: { slug }
    })

    if (existingOrg) {
      return NextResponse.json(
        { error: 'Organization slug already exists' },
        { status: 400 }
      )
    }

    let ownerUser = await prisma.user.findUnique({
      where: { email: ownerEmail }
    })

    const setupToken = crypto.randomBytes(32).toString('hex')
    const houseInviteToken = crypto.randomBytes(32).toString('hex')

    console.log('🔑 Generated token:', setupToken.substring(0, 30) + '...')

    if (!ownerUser) {
      ownerUser = await prisma.user.create({
        data: {
          email: ownerEmail,
          name: ownerName || ownerEmail.split('@')[0],
          invitationToken: setupToken,
          invitationSentAt: new Date(),
        }
      })
      console.log('✅ Created new user with token:', { 
        email: ownerEmail, 
        userId: ownerUser.id,
        token: setupToken.substring(0, 30) + '...',
        sentAt: new Date().toISOString()
      })
    } else {
      ownerUser = await prisma.user.update({
        where: { id: ownerUser.id },
        data: {
          invitationToken: setupToken,
          invitationSentAt: new Date(),
        }
      })
      console.log('✅ Updated existing user with token:', { 
        email: ownerEmail, 
        userId: ownerUser.id,
        token: setupToken.substring(0, 30) + '...',
        sentAt: new Date().toISOString()
      })
    }

    let platform = await prisma.platform.findFirst()
    if (!platform) {
      platform = await prisma.platform.create({
        data: {
          name: 'MembersHome',
          settings: {}
        }
      })
    }

    const organization = await prisma.organization.create({
      data: {
        name,
        slug,
        description,
        plan: plan as PlanType || 'FREE',
        billingEmail: billingEmail || ownerEmail,
        website,
        platformId: platform.id,
        status: 'TRIAL',
      }
    })

    console.log('✅ Created organization:', { orgId: organization.id, name: organization.name })

    const membership = await prisma.membership.create({
      data: {
        userId: ownerUser.id,
        organizationId: organization.id,
        role: 'ORG_OWNER',
        status: 'ACTIVE',
      }
    })

    const houseSlug = 'main'
    const houseName = customHouseName || `${name} Main`
    
    const defaultHouse = await prisma.house.create({
      data: {
        name: houseName,
        slug: houseSlug,
        description: `Default house for ${name}`,
        organizationId: organization.id,
        isPrivate: false,
      }
    })

    console.log('✅ Created default house:', { houseId: defaultHouse.id, name: houseName })

    const houseMembership = await prisma.houseMembership.create({
      data: {
        houseId: defaultHouse.id,
        membershipId: membership.id,
        role: 'HOUSE_MANAGER',
        status: 'ACTIVE',
        acceptanceToken: houseInviteToken,
        acceptanceTokenSentAt: new Date(),
      }
    })

    await prisma.memberProfile.upsert({
      where: { houseMembershipId: houseMembership.id },
      update: {},
      create: {
        houseMembershipId: houseMembership.id,
        userId: ownerUser.id,
        houseId: defaultHouse.id,
        jobTitle: 'Owner',
      }
    })

    await prisma.memberDashboard.upsert({
      where: { houseMembershipId: houseMembership.id },
      update: {},
      create: {
        houseMembershipId: houseMembership.id,
        userId: ownerUser.id,
        houseId: defaultHouse.id,
      }
    })

    await prisma.memberPortal.upsert({
      where: { houseId: defaultHouse.id },
      update: {},
      create: {
        houseId: defaultHouse.id,
        organizationId: organization.id,
        theme: {
          primaryColor: '#3B82F6',
          secondaryColor: '#1E40AF',
        },
        features: {
          enableDirectory: true,
          enableMessaging: true,
          enableEvents: true,
        },
        welcomeMessage: `Welcome to ${houseName}!`,
      }
    })

    const setupUrl = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invite?token=${setupToken}&type=org-owner&orgId=${organization.id}&houseId=${defaultHouse.id}`
    
    console.log('📧 INVITATION URL:', setupUrl)
    
    await sendEmail({
      to: ownerEmail,
      template: 'invitation',
      data: {
        name: ownerUser.name || ownerEmail.split('@')[0],
        organizationName: name,
        houseName: houseName,
        setupUrl,
        role: 'Organization Owner',
      }
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: 'ORGANIZATION_CREATED',
        entityType: 'ORGANIZATION',
        entityId: organization.id,
        organizationId: organization.id,
        metadata: {
          organizationName: name,
          ownerEmail,
          plan,
          defaultHouseCreated: true,
          defaultHouseName: houseName,
        }
      }
    })

    return NextResponse.json({
      success: true,
      organization,
      defaultHouse,
      message: 'Organization and default house created successfully. Owner notified.'
    }, { status: 201 })
  } catch (error) {
    console.error('❌ Create organization error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}