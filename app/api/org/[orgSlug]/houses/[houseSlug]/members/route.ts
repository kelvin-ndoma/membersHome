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
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const house = await prisma.house.findFirst({
      where: {
        slug: params.houseSlug,
        organization: { slug: params.orgSlug }
      },
      select: { id: true }
    })

    if (!house) {
      return NextResponse.json(
        { error: 'House not found' },
        { status: 404 }
      )
    }

    const where: any = { houseId: house.id }
    if (role) where.role = role
    if (status) where.status = status
    if (search) {
      where.OR = [
        { membership: { user: { name: { contains: search, mode: 'insensitive' } } } },
        { membership: { user: { email: { contains: search, mode: 'insensitive' } } } },
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
            }
          }
        }
      }),
      prisma.houseMembership.count({ where })
    ])

    return NextResponse.json({
      members,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get members error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}