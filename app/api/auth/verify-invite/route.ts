// app/api/auth/verify-invite/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const token = searchParams.get('token')

    console.log('🔍 VERIFY INVITE CALLED')
    console.log('🔑 Token received:', token)

    if (!token) {
      console.log('❌ No token provided')
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    console.log('🔍 Searching for user with token...')

    // Check User model - WITHOUT date check for debugging
    const user = await prisma.user.findFirst({
      where: {
        invitationToken: token,
        // Date check removed for debugging
      },
      include: {
        memberships: {
          where: { role: 'ORG_OWNER' },
          include: {
            organization: {
              include: {
                houses: {
                  take: 1,
                  orderBy: { createdAt: 'asc' }
                }
              }
            }
          }
        }
      }
    })

    console.log('👤 User query result:', user ? `Found: ${user.email}` : 'NOT FOUND')

    // Also check ALL users with any token for debugging
    const allUsersWithTokens = await prisma.user.findMany({
      where: { invitationToken: { not: null } },
      select: { email: true, invitationToken: true }
    })
    
    console.log('📋 All users with tokens:', allUsersWithTokens.length)
    allUsersWithTokens.forEach(u => {
      console.log(`   - ${u.email}: ${u.invitationToken?.substring(0, 20)}...`)
    })

    if (user) {
      const org = user.memberships[0]?.organization
      const house = org?.houses[0]

      console.log('✅ Found user invitation:', {
        email: user.email,
        userId: user.id,
        orgId: org?.id,
        orgName: org?.name,
        houseId: house?.id,
        houseName: house?.name,
        hasPassword: !!user.passwordHash
      })

      return NextResponse.json({
        valid: true,
        type: 'org-owner',
        inviteData: {
          userId: user.id,
          email: user.email,
          name: user.name || user.email.split('@')[0],
          role: 'Organization Owner',
          organizationId: org?.id,
          organizationName: org?.name,
          houseId: house?.id,
          houseName: house?.name,
          needsPassword: !user.passwordHash,
        }
      })
    }

    // Check HouseMembership
    console.log('🔍 Checking house memberships...')
    
    const houseMembership = await prisma.houseMembership.findFirst({
      where: {
        acceptanceToken: token,
      },
      include: {
        membership: {
          include: {
            user: true,
          },
        },
        house: {
          include: {
            organization: true,
          },
        },
      }
    })

    console.log('🏠 House membership query result:', houseMembership ? 'Found' : 'NOT FOUND')

    if (houseMembership) {
      const user = houseMembership.membership.user
      const house = houseMembership.house
      const org = house.organization

      console.log('✅ Found house membership invitation:', user.email)

      return NextResponse.json({
        valid: true,
        type: 'house-manager',
        inviteData: {
          userId: user.id,
          email: user.email,
          name: user.name || user.email.split('@')[0],
          role: houseMembership.role === 'HOUSE_MANAGER' ? 'House Manager' : 'House Staff',
          organizationId: org.id,
          organizationName: org.name,
          houseId: house.id,
          houseName: house.name,
          needsPassword: !user.passwordHash,
        }
      })
    }

    console.log('❌ Token not found in User or HouseMembership')
    return NextResponse.json(
      { error: 'Invalid or expired invitation token' },
      { status: 400 }
    )

  } catch (error) {
    console.error('❌ Verify invite error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}