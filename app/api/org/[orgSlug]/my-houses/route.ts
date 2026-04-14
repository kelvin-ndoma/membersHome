// app/api/org/[orgSlug]/my-houses/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { orgSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orgSlug } = await Promise.resolve(params)

    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug }
    })

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Get user's membership with house memberships
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organizationId: organization.id,
        status: 'ACTIVE'
      },
      include: {
        houseMemberships: {
          where: { status: 'ACTIVE' },
          include: {
            house: true
          }
        }
      }
    })

    const isOrgAdmin = membership?.role === 'ORG_OWNER' || membership?.role === 'ORG_ADMIN'
    
    const houses: Array<{
      id: string
      name: string
      slug: string
      role: string
      isStaff: boolean
    }> = []

    // Add user's house memberships
    if (membership) {
      for (const hm of membership.houseMemberships) {
        houses.push({
          id: hm.house.id,
          name: hm.house.name,
          slug: hm.house.slug,
          role: hm.role,
          isStaff: ['HOUSE_MANAGER', 'HOUSE_ADMIN', 'HOUSE_STAFF'].includes(hm.role)
        })
      }
    }

    // If org admin, add all houses in the org
    if (isOrgAdmin) {
      const allOrgHouses = await prisma.house.findMany({
        where: { organizationId: organization.id }
      })
      
      for (const house of allOrgHouses) {
        const existing = houses.find(h => h.id === house.id)
        if (!existing) {
          houses.push({
            id: house.id,
            name: house.name,
            slug: house.slug,
            role: 'ORG_ADMIN',
            isStaff: true
          })
        }
      }
    }

    return NextResponse.json({ houses })
  } catch (error) {
    console.error('My houses error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}