// app/api/portal/[houseSlug]/seller/products/[productId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { houseSlug: string; productId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { houseSlug, productId } = params

    // Get house
    const house = await prisma.house.findFirst({
      where: { slug: houseSlug },
      select: { id: true }
    })

    if (!house) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

    // Get product and verify it belongs to seller and is in this house
    const product = await prisma.communityProduct.findFirst({
      where: {
        id: productId,
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
        }
      }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        currency: product.currency,
        type: product.type,
        category: product.category,
        images: product.images,
        inventory: product.inventory,
        isDigital: product.isDigital,
        requiresShipping: product.requiresShipping,
        isPublished: product.isPublished,
        status: product.status,
        salesCount: product.salesCount,
        revenue: product.revenue,
        communityId: product.community.id,
        communityName: product.community.name,
        communitySlug: product.community.slug,
        createdAt: product.createdAt
      }
    })
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { houseSlug: string; productId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { houseSlug, productId } = params
    const body = await req.json()
    const {
      name,
      description,
      price,
      compareAtPrice,
      type,
      category,
      images,
      inventory,
      isDigital,
      requiresShipping,
      isPublished
    } = body

    // Get house
    const house = await prisma.house.findFirst({
      where: { slug: houseSlug },
      select: { id: true }
    })

    if (!house) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

    // Verify product belongs to seller and is in this house
    const existingProduct = await prisma.communityProduct.findFirst({
      where: {
        id: productId,
        sellerId: session.user.id,
        community: {
          houseId: house.id
        }
      }
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found or unauthorized' }, { status: 404 })
    }

    // Update product
    const updatedProduct = await prisma.communityProduct.update({
      where: { id: productId },
      data: {
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined,
        price: price !== undefined ? price : undefined,
        compareAtPrice: compareAtPrice !== undefined ? compareAtPrice : null,
        type: type !== undefined ? type : undefined,
        category: category !== undefined ? category : null,
        images: images !== undefined ? images : undefined,
        inventory: inventory !== undefined ? (inventory ? parseInt(inventory) : null) : undefined,
        isDigital: isDigital !== undefined ? isDigital : undefined,
        requiresShipping: requiresShipping !== undefined ? requiresShipping : undefined,
        isPublished: isPublished !== undefined ? isPublished : undefined
      }
    })

    return NextResponse.json({
      success: true,
      product: {
        id: updatedProduct.id,
        name: updatedProduct.name,
        price: updatedProduct.price,
        isPublished: updatedProduct.isPublished
      }
    })
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}