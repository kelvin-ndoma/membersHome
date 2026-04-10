// app/api/auth/verify-invite-token/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    // Check User model first
    const user = await prisma.user.findFirst({
      where: {
        invitationToken: token,
        invitationSentAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        memberships: {
          where: { role: 'ORG_OWNER' },
          include: { organization: { include: { houses: { take: 1 } } } }
        }
      }
    })

    if (user) {
      const org = user.memberships[0]?.organization
      return NextResponse.json({
        valid: true,
        inviteData: {
          userId: user.id,
          email: user.email,
          name: user.name,
          role: 'Organization Owner',
          organizationName: org?.name,
          houseName: org?.houses[0]?.name,
        }
      })
    }

    // Check HouseMembership
    const houseMembership = await prisma.houseMembership.findFirst({
      where: {
        acceptanceToken: token,
        acceptanceTokenSentAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        membership: { include: { user: true } },
        house: { include: { organization: true } },
      }
    })

    if (houseMembership) {
      return NextResponse.json({
        valid: true,
        inviteData: {
          userId: houseMembership.membership.user.id,
          email: houseMembership.membership.user.email,
          name: houseMembership.membership.user.name,
          role: 'House Manager',
          organizationName: houseMembership.house.organization.name,
          houseName: houseMembership.house.name,
        }
      })
    }

    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
  } catch (error) {
    console.error('Verify token error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}