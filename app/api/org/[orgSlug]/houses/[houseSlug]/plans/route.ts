// app/api/org/[orgSlug]/houses/[houseSlug]/plans/route.ts
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

    const plans = await prisma.membershipPlan.findMany({
      where: {
        OR: [
          { houseId: house.id },
          { organizationId: house.organizationId, houseId: null }
        ],
        status: 'ACTIVE'
      },
      include: {
        prices: {
          orderBy: { amount: 'asc' }
        },
        _count: {
          select: {
            memberships: true,
            applications: {
              where: { status: { in: ['PENDING', 'REVIEWING'] } }
            }
          }
        }
      },
      orderBy: [{ type: 'asc' }, { createdAt: 'desc' }]
    })

    return NextResponse.json({ plans })
  } catch (error) {
    console.error('Get plans error:', error)
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

    const {
      name,
      description,
      type,
      features,
      isPublic,
      requiresApproval,
      prices,
      settings,
    } = await req.json()

    if (!name || !type || !prices || prices.length === 0) {
      return NextResponse.json(
        { error: 'Name, type, and at least one price are required' },
        { status: 400 }
      )
    }

    const plan = await prisma.membershipPlan.create({
      data: {
        name,
        description,
        type: type || 'STANDARD',
        features: features || [],
        isPublic: isPublic !== false,
        requiresApproval: requiresApproval || false,
        status: 'ACTIVE',
        organizationId: house.organizationId,
        houseId: house.id,
        settings: settings || {},
        prices: {
          create: prices.map((p: any) => ({
            billingFrequency: p.billingFrequency,
            amount: p.amount,
            currency: p.currency || 'USD',
            // setupFee removed
          }))
        }
      },
      include: {
        prices: true
      }
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email || '',
        action: 'MEMBERSHIP_PLAN_CREATED',
        entityType: 'MEMBERSHIP_PLAN',
        entityId: plan.id,
        organizationId: house.organizationId,
        houseId: house.id,
        metadata: { name, type, pricesCount: prices.length }
      }
    })

    return NextResponse.json({
      success: true,
      plan
    }, { status: 201 })
  } catch (error) {
    console.error('Create plan error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}