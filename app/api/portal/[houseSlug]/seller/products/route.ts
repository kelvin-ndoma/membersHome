// app/api/portal/[houseSlug]/seller/products/route.ts
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
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get house first
    const house = await prisma.house.findFirst({
      where: { slug: houseSlug },
      select: { id: true }
    })

    if (!house) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

    console.log('Fetching products for house:', house.id, 'seller:', session.user.id)

    // Get all products by this seller in communities under this house
    // Don't filter by status - show all products
    const products = await prisma.communityProduct.findMany({
      where: {
        sellerId: session.user.id,
        community: {
          houseId: house.id
        }
      },
      include: {
        community: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        _count: {
          select: {
            purchases: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })

    console.log('Found products:', products.length)

    const total = await prisma.communityProduct.count({
      where: {
        sellerId: session.user.id,
        community: {
          houseId: house.id
        }
      }
    })

    return NextResponse.json({
      success: true,
      products: products.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        type: p.type,
        category: p.category,
        images: p.images,
        inventory: p.inventory,
        isPublished: p.isPublished,
        status: p.status,
        salesCount: p._count.purchases,
        revenue: p.revenue,
        createdAt: p.createdAt,
        communityName: p.community.name,
        communitySlug: p.community.slug
      })),
      total
    })
  } catch (error) {
    console.error('Error fetching seller products:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}