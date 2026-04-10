// app/api/org/[orgSlug]/houses/[houseSlug]/applications/route.ts
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
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const planId = searchParams.get('planId')

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

    // Check if user has permission to view applications
    const canView = await prisma.houseMembership.findFirst({
      where: {
        houseId: house.id,
        membership: { userId: session.user.id },
        role: { in: ['HOUSE_MANAGER', 'HOUSE_ADMIN', 'HOUSE_STAFF'] }
      }
    })

    if (!canView) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const where: any = { houseId: house.id }
    if (status) where.status = status
    if (planId) where.membershipPlanId = planId

    const [applications, total] = await Promise.all([
      prisma.membershipApplication.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          membershipPlan: {
            select: { id: true, name: true, type: true }
          },
          selectedPrice: {
            select: { billingFrequency: true, amount: true, currency: true }
          },
          reviewer: {
            select: { id: true, name: true, email: true }
          }
        }
      }),
      prisma.membershipApplication.count({ where })
    ])

    return NextResponse.json({
      applications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get applications error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}