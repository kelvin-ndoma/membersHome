// app/api/portal/[houseSlug]/membership/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { houseSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { houseSlug } = await Promise.resolve(params)

    // First, find all houses with this slug
    const houses = await prisma.house.findMany({
      where: { slug: houseSlug },
      include: {
        organization: {
          select: { id: true, name: true, slug: true }
        }
      }
    })

    if (houses.length === 0) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

    // Find the user's membership for ANY of these houses
    let targetHouse = null
    let memberAccess = null

    for (const house of houses) {
      const membership = await prisma.houseMembership.findFirst({
        where: {
          houseId: house.id,
          membership: { 
            userId: session.user.id,
            status: 'ACTIVE'
          },
          status: 'ACTIVE'
        },
        include: {
          membershipItems: {
            where: { status: 'ACTIVE' },
            include: {
              membershipPlan: {
                include: { prices: true }
              },
              planPrice: true
            }
          },
          membership: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                  phone: true,
                }
              }
            }
          },
          memberProfile: true
        }
      })
      
      if (membership) {
        targetHouse = house
        memberAccess = membership
        break
      }
    }

    // If still not found, check if user is org admin
    if (!memberAccess) {
      for (const house of houses) {
        const orgMembership = await prisma.membership.findFirst({
          where: {
            userId: session.user.id,
            organizationId: house.organizationId,
            role: { in: ['ORG_OWNER', 'ORG_ADMIN'] },
            status: 'ACTIVE'
          }
        })
        
        if (orgMembership) {
          targetHouse = house
          memberAccess = {
            id: `admin-${house.id}`,
            role: 'ORG_ADMIN',
            status: 'ACTIVE',
            membershipNumber: null,
            joinedAt: orgMembership.joinedAt,
            membership: {
              user: {
                id: session.user.id,
                name: session.user.name,
                email: session.user.email,
                image: null,
                phone: null,
              }
            },
            membershipItems: [],
            memberProfile: null
          } as any
          break
        }
      }
    }

    if (!memberAccess || !targetHouse) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 })
    }

    // Get available plans for upgrade/downgrade
    const availablePlans = await prisma.membershipPlan.findMany({
      where: {
        OR: [
          { houseId: targetHouse.id },
          { organizationId: targetHouse.organizationId, houseId: null }
        ],
        status: 'ACTIVE',
        isPublic: true
      },
      include: {
        prices: {
          orderBy: { amount: 'asc' }
        }
      },
      orderBy: { type: 'asc' }
    })

    const joinedAt = memberAccess.joinedAt instanceof Date 
      ? memberAccess.joinedAt.toISOString() 
      : memberAccess.joinedAt

    return NextResponse.json({
      house: {
        id: targetHouse.id,
        name: targetHouse.name,
        slug: targetHouse.slug,
        description: targetHouse.description
      },
      membership: {
        id: memberAccess.id,
        role: memberAccess.role,
        status: memberAccess.status,
        membershipNumber: memberAccess.membershipNumber,
        joinedAt: joinedAt
      },
      subscription: memberAccess.membershipItems?.[0] || null,
      availablePlans,
      profile: {
        user: memberAccess.membership?.user || {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
        },
        ...memberAccess.memberProfile
      }
    })
  } catch (error) {
    console.error('Membership error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}