// app/api/public/houses/[houseSlug]/plans/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { houseSlug: string } }
) {
  try {
    const searchParams = req.nextUrl.searchParams
    const orgSlug = searchParams.get('orgSlug')

    console.log('Fetching plans for house:', params.houseSlug, 'org:', orgSlug)

    if (!orgSlug) {
      return NextResponse.json(
        { error: 'Organization slug is required' },
        { status: 400 }
      )
    }

    const house = await prisma.house.findFirst({
      where: {
        slug: params.houseSlug,
        organization: { slug: orgSlug },
        isPrivate: false,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            primaryColor: true,
          }
        },
        membershipPlans: {
          where: {
            status: 'ACTIVE',
            isPublic: true,
          },
          include: {
            prices: {
              orderBy: { amount: 'asc' }
            }
          },
          orderBy: { type: 'asc' },
        }
      }
    })

    if (!house) {
      console.log('House not found:', params.houseSlug, orgSlug)
      return NextResponse.json(
        { error: 'House not found or is private' },
        { status: 404 }
      )
    }

    console.log('Found house:', house.name, 'with', house.membershipPlans.length, 'plans')

    return NextResponse.json({ house, plans: house.membershipPlans })
  } catch (error) {
    console.error('Get house plans error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}