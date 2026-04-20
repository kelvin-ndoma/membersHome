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

    // Get house
    const house = await prisma.house.findFirst({
      where: { slug: houseSlug },
      select: { id: true }
    })

    if (!house) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

    const where: any = {
      sellerId: session.user.id,
      community: {
        houseId: house.id
      }
    }

    if (status && status !== 'all') {
      if (status === 'active') {
        where.status = 'ACTIVE'
        where.isPublished = true
      } else if (status === 'pending') {
        where.isPublished = false
      } else if (status === 'sold_out') {
        where.inventory = 0
      }
    }

    const products = await prisma.communityProduct.findMany({
      where,
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

    const total = await prisma.communityProduct.count({ where })

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

export async function DELETE(
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
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
    }

    // Get house
    const house = await prisma.house.findFirst({
      where: { slug: houseSlug },
      select: { id: true }
    })

    if (!house) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

    // Verify product belongs to seller and is in this house
    const product = await prisma.communityProduct.findFirst({
      where: {
        id: productId,
        sellerId: session.user.id,
        community: {
          houseId: house.id
        }
      }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Soft delete
    await prisma.communityProduct.update({
      where: { id: productId },
      data: { status: 'DISCONTINUED', isPublished: false }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}