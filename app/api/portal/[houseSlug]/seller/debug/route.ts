// app/api/portal/[houseSlug]/seller/debug/route.ts
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
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { houseSlug } = params

    // Get house
    const house = await prisma.house.findFirst({
      where: { slug: houseSlug },
      select: { id: true, name: true }
    })

    if (!house) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

    // Get all communities under this house
    const communities = await prisma.community.findMany({
      where: { houseId: house.id },
      select: { id: true, name: true, slug: true }
    })

    // Get all products by this seller in any community
    const allProducts = await prisma.communityProduct.findMany({
      where: {
        sellerId: session.user.id
      },
      include: {
        community: {
          include: {
            house: {
              select: { id: true, name: true, slug: true }
            }
          }
        }
      }
    })

    // Filter products that belong to this house
    const productsInThisHouse = allProducts.filter(p => p.community.houseId === house.id)

    return NextResponse.json({
      house: {
        id: house.id,
        name: house.name,
        slug: houseSlug
      },
      communitiesInHouse: communities.map(c => ({ id: c.id, name: c.name })),
      allUserProducts: allProducts.map(p => ({
        id: p.id,
        name: p.name,
        communityName: p.community.name,
        houseName: p.community.house.name,
        houseId: p.community.house.id,
        matchesCurrentHouse: p.community.houseId === house.id
      })),
      productsInThisHouse: productsInThisHouse.length,
      totalProducts: allProducts.length
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}