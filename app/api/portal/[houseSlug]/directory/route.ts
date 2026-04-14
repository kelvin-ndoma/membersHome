// app/api/portal/[houseSlug]/directory/route.ts
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

    const searchParams = req.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role')

    const house = await prisma.house.findFirst({
      where: { slug: params.houseSlug },
      include: {
        memberPortal: true
      }
    })

    if (!house) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

    const features = house.memberPortal?.features as any
    if (features && !features.enableDirectory) {
      return NextResponse.json({ error: 'Directory is disabled' }, { status: 403 })
    }

    const memberAccess = await prisma.houseMembership.findFirst({
      where: {
        houseId: house.id,
        membership: { userId: session.user.id },
        status: 'ACTIVE'
      }
    })

    if (!memberAccess) {
      return NextResponse.json({ error: 'Not a member of this house' }, { status: 403 })
    }

    const where: any = {
      houseId: house.id,
      status: 'ACTIVE'
    }

    if (role) {
      where.role = role
    }

    if (search) {
      where.OR = [
        { membership: { user: { name: { contains: search, mode: 'insensitive' } } } },
        { membership: { user: { email: { contains: search, mode: 'insensitive' } } } },
        { memberProfile: { company: { contains: search, mode: 'insensitive' } } },
        { memberProfile: { jobTitle: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [members, total] = await Promise.all([
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
              industry: true,
              bio: true,
              skills: true,
              interests: true,
              socialLinks: true,
              phone: true,
            }
          }
        }
      }),
      prisma.houseMembership.count({ where })
    ])

    const filteredMembers = members.map(member => {
      const profile = member.memberProfile as any
      const privacy = profile?.privacySettings || {}
      const filteredProfile = profile ? { ...profile } : null
      
      if (filteredProfile) {
        if (privacy.hideEmail) {
          member.membership.user.email = ''
        }
        if (privacy.hidePhone && filteredProfile.phone) {
          filteredProfile.phone = ''
        }
        if (privacy.hideCompany) {
          filteredProfile.company = ''
        }
      }
      
      return {
        ...member,
        memberProfile: filteredProfile
      }
    })

    return NextResponse.json({
      members: filteredMembers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Directory error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}