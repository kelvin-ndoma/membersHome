// app/api/org/[orgSlug]/houses/[houseSlug]/members/route.ts
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

    const searchParams = req.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const role = searchParams.get('role')
    const status = searchParams.get('status') || 'ACTIVE'
    const search = searchParams.get('search')
    const planId = searchParams.get('planId')

    const house = await prisma.house.findFirst({
      where: {
        slug: params.houseSlug,
        organization: { slug: params.orgSlug }
      },
      include: {
        organization: true,
      }
    })

    if (!house) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

    const where: any = {
      houseId: house.id,
      status: status as any,
    }

    if (role) where.role = role
    if (planId) {
      where.membershipItems = {
        some: {
          membershipPlanId: planId,
          status: 'ACTIVE'
        }
      }
    }
    if (search) {
      where.OR = [
        { membership: { user: { name: { contains: search, mode: 'insensitive' } } } },
        { membership: { user: { email: { contains: search, mode: 'insensitive' } } } },
      ]
    }

    const [members, total, roleCounts, statusCounts] = await Promise.all([
      prisma.houseMembership.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { joinedAt: 'desc' },
        include: {
          membership: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                }
              }
            }
          },
          memberProfile: {
            select: {
              jobTitle: true,
              company: true,
            }
          },
          membershipItems: {
            where: { status: 'ACTIVE' },
            include: {
              membershipPlan: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                }
              },
              planPrice: {
                select: {
                  amount: true,
                  currency: true,
                  billingFrequency: true,
                }
              }
            },
            take: 1,
            orderBy: { createdAt: 'desc' }
          }
        }
      }),
      prisma.houseMembership.count({ where }),
      prisma.houseMembership.groupBy({
        by: ['role'],
        where: { houseId: house.id },
        _count: true,
      }),
      prisma.houseMembership.groupBy({
        by: ['status'],
        where: { houseId: house.id },
        _count: true,
      }),
    ])

    // Get plan counts separately
    const planCountsRaw = await prisma.membershipItem.groupBy({
      by: ['membershipPlanId'],
      where: {
        houseMembership: { 
          houseId: house.id,
          status: 'ACTIVE'
        },
        status: 'ACTIVE'
      },
      _count: true,
    })

    // Get plan names
    const planIds = planCountsRaw.map(p => p.membershipPlanId).filter(Boolean)
    const plans = planIds.length > 0 ? await prisma.membershipPlan.findMany({
      where: { id: { in: planIds } },
      select: { id: true, name: true }
    }) : []

    const planCounts = planCountsRaw.map(p => {
      const plan = plans.find(pl => pl.id === p.membershipPlanId)
      return {
        planId: p.membershipPlanId,
        planName: plan?.name || 'Unknown Plan',
        _count: p._count
      }
    }).filter(p => p.planId)

    // Add membershipItem to each member
    const membersWithPlan = members.map(member => ({
      ...member,
      membershipItem: member.membershipItems[0] || null
    }))

    console.log('Plan counts:', planCounts)
    console.log('First member plan:', membersWithPlan[0]?.membershipItem?.membershipPlan?.name)

    return NextResponse.json({
      house,
      members: membersWithPlan,
      roleCounts,
      statusCounts,
      planCounts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get members error:', error)
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

    const body = await req.json()
    const { email, name, role = 'HOUSE_MEMBER', membershipPlanId, planPriceId } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const house = await prisma.house.findFirst({
      where: {
        slug: params.houseSlug,
        organization: { slug: params.orgSlug }
      },
      include: { organization: true }
    })

    if (!house) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

    // Find or create user
    let user = await prisma.user.findUnique({ where: { email } })
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
        }
      })
    }

    // Find or create organization membership
    let membership = await prisma.membership.findFirst({
      where: {
        userId: user.id,
        organizationId: house.organizationId
      }
    })

    if (!membership) {
      membership = await prisma.membership.create({
        data: {
          userId: user.id,
          organizationId: house.organizationId,
          role: 'MEMBER',
          status: 'ACTIVE',
        }
      })
    }

    // Check if already a house member
    const existingHouseMember = await prisma.houseMembership.findFirst({
      where: {
        houseId: house.id,
        membershipId: membership.id
      }
    })

    if (existingHouseMember) {
      return NextResponse.json({ error: 'User is already a member of this house' }, { status: 400 })
    }

    // Create house membership
    const houseMembership = await prisma.houseMembership.create({
      data: {
        houseId: house.id,
        membershipId: membership.id,
        role: role as any,
        status: 'ACTIVE',
      }
    })

    // Create membership item if plan is selected
    if (membershipPlanId && planPriceId) {
      const planPrice = await prisma.planPrice.findUnique({
        where: { id: planPriceId },
        include: { membershipPlan: true }
      })

      if (planPrice) {
        await prisma.membershipItem.create({
          data: {
            organizationId: house.organizationId,
            houseId: house.id,
            houseMembershipId: houseMembership.id,
            membershipPlanId,
            planPriceId,
            userId: user.id,
            status: 'ACTIVE',
            billingFrequency: planPrice.billingFrequency,
            amount: planPrice.amount,
            currency: planPrice.currency,
            startDate: new Date()
          }
        })
      }
    }

    // Create member profile and dashboard
    await prisma.memberProfile.upsert({
      where: { houseMembershipId: houseMembership.id },
      update: {},
      create: {
        houseMembershipId: houseMembership.id,
        userId: user.id,
        houseId: house.id,
      }
    })

    await prisma.memberDashboard.upsert({
      where: { houseMembershipId: houseMembership.id },
      update: {},
      create: {
        houseMembershipId: houseMembership.id,
        userId: user.id,
        houseId: house.id,
      }
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email || '',
        action: 'MEMBER_ADDED',
        entityType: 'HOUSE_MEMBERSHIP',
        entityId: houseMembership.id,
        organizationId: house.organizationId,
        houseId: house.id,
        metadata: { email, role }
      }
    })

    return NextResponse.json({
      success: true,
      member: houseMembership
    }, { status: 201 })
  } catch (error) {
    console.error('Add member error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}