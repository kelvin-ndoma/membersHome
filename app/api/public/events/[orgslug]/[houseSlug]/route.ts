// app/api/public/events/[orgSlug]/[houseSlug]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string } }
) {
  try {
    const searchParams = req.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const house = await prisma.house.findFirst({
      where: {
        slug: params.houseSlug,
        organization: { slug: params.orgSlug },
        isPrivate: false,
      },
      select: { id: true, organizationId: true }
    })

    if (!house) {
      return NextResponse.json(
        { error: 'House not found or is private' },
        { status: 404 }
      )
    }

    const where: any = {
      OR: [
        { houseId: house.id },
        { organizationId: house.organizationId, houseId: null }
      ],
      status: 'PUBLISHED',
      memberOnly: false,
      startDate: { gte: new Date() }
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { startDate: 'asc' },
        include: {
          _count: {
            select: { rsvps: true }
          },
          tickets: {
            where: {
              status: 'ACTIVE',
              isPublic: true,
            },
            select: {
              id: true,
              name: true,
              price: true,
              currency: true,
              type: true,
            }
          }
        }
      }),
      prisma.event.count({ where })
    ])

    return NextResponse.json({
      events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get public events error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}