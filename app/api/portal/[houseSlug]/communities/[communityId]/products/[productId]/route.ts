// app/api/portal/[houseSlug]/communities/[communityId]/products/[productId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'
import { ObjectId } from 'mongodb'

export async function GET(
  req: NextRequest,
  { params }: { params: { houseSlug: string; communityId: string; productId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { houseSlug, communityId, productId } = params

    // Get house
    const house = await prisma.house.findFirst({
      where: { slug: houseSlug },
      select: { id: true, marketplaceFeePercent: true }
    })

    if (!house) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

    // Get user's house membership
    const houseMembership = await prisma.houseMembership.findFirst({
      where: {
        houseId: house.id,
        membership: {
          userId: session.user.id
        }
      },
      select: { id: true, status: true }
    })

    if (!houseMembership || houseMembership.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Active membership required' }, { status: 403 })
    }

    // Find community
    const isObjectId = ObjectId.isValid(communityId)
    const communityWhere: any = { houseId: house.id }
    if (isObjectId) {
      communityWhere.id = communityId
    } else {
      communityWhere.slug = communityId
    }

    const community = await prisma.community.findFirst({
      where: communityWhere,
      select: { id: true }
    })

    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }

    // Check if user is a member
    const communityMember = await prisma.communityMember.findFirst({
      where: {
        communityId: community.id,
        houseMembershipId: houseMembership.id,
        status: 'ACTIVE'
      },
      select: { id: true }
    })

    if (!communityMember) {
      return NextResponse.json({ error: 'Must be a member to view products' }, { status: 403 })
    }

    // Get product
    const product = await prisma.communityProduct.findFirst({
      where: {
        id: productId,
        communityId: community.id,
        status: 'ACTIVE'
      },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true
          }
        },
        purchases: {
          where: {
            buyerId: session.user.id
          },
          select: {
            id: true,
            status: true
          },
          take: 1
        },
        _count: {
          select: {
            purchases: true
          }
        }
      }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Calculate fee information
    const houseFeePercent = product.houseFeePercent ?? house.marketplaceFeePercent ?? 5
    const platformFeePercent = product.platformFeePercent ?? 0
    const houseFeeAmount = product.price * houseFeePercent / 100
    const platformFeeAmount = product.price * platformFeePercent / 100
    const sellerPayoutAmount = product.price - houseFeeAmount - platformFeeAmount

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
        fileUrl: product.fileUrl,
        downloadLimit: product.downloadLimit,
        requiresShipping: product.requiresShipping,
        salesCount: product._count.purchases,
        revenue: product.revenue,
        seller: {
          id: product.seller.id,
          name: product.seller.name,
          image: product.seller.image,
          email: product.seller.email
        },
        hasPurchased: product.purchases.length > 0,
        createdAt: product.createdAt,
        feeBreakdown: {
          houseFeePercent,
          platformFeePercent,
          houseFeeAmount,
          platformFeeAmount,
          sellerPayoutAmount
        }
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
  { params }: { params: { houseSlug: string; communityId: string; productId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { houseSlug, communityId, productId } = params
    const body = await req.json()
    const {
      name,
      description,
      price,
      compareAtPrice,
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

    // Get user's house membership
    const houseMembership = await prisma.houseMembership.findFirst({
      where: {
        houseId: house.id,
        membership: {
          userId: session.user.id
        }
      },
      select: { id: true }
    })

    if (!houseMembership) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Find community
    const isObjectId = ObjectId.isValid(communityId)
    const communityWhere: any = { houseId: house.id }
    if (isObjectId) {
      communityWhere.id = communityId
    } else {
      communityWhere.slug = communityId
    }

    const community = await prisma.community.findFirst({
      where: communityWhere,
      select: { id: true }
    })

    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }

    // Check if user is the seller or admin
    const product = await prisma.communityProduct.findFirst({
      where: {
        id: productId,
        communityId: community.id
      },
      select: {
        id: true,
        sellerId: true
      }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const isSeller = product.sellerId === session.user.id
    
    // Check if user is admin of community
    const communityMember = await prisma.communityMember.findFirst({
      where: {
        communityId: community.id,
        houseMembershipId: houseMembership.id,
        role: { in: ['OWNER', 'ADMIN'] }
      },
      select: { id: true }
    })

    if (!isSeller && !communityMember) {
      return NextResponse.json({ error: 'Only seller or admin can update product' }, { status: 403 })
    }

    // Update product
    const updated = await prisma.communityProduct.update({
      where: { id: productId },
      data: {
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined,
        price: price !== undefined ? price : undefined,
        compareAtPrice: compareAtPrice !== undefined ? compareAtPrice : undefined,
        category: category !== undefined ? category : undefined,
        images: images !== undefined ? images : undefined,
        inventory: inventory !== undefined ? inventory : undefined,
        isDigital: isDigital !== undefined ? isDigital : undefined,
        requiresShipping: requiresShipping !== undefined ? requiresShipping : undefined,
        isPublished: isPublished !== undefined ? isPublished : undefined
      },
      select: {
        id: true,
        name: true,
        price: true,
        description: true,
        isPublished: true,
        inventory: true,
        images: true
      }
    })

    return NextResponse.json({ 
      success: true, 
      product: updated,
      message: 'Product updated successfully'
    })
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { houseSlug: string; communityId: string; productId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { houseSlug, communityId, productId } = params

    // Get house
    const house = await prisma.house.findFirst({
      where: { slug: houseSlug },
      select: { id: true }
    })

    if (!house) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

    // Get user's house membership
    const houseMembership = await prisma.houseMembership.findFirst({
      where: {
        houseId: house.id,
        membership: {
          userId: session.user.id
        }
      },
      select: { id: true }
    })

    if (!houseMembership) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Find community
    const isObjectId = ObjectId.isValid(communityId)
    const communityWhere: any = { houseId: house.id }
    if (isObjectId) {
      communityWhere.id = communityId
    } else {
      communityWhere.slug = communityId
    }

    const community = await prisma.community.findFirst({
      where: communityWhere,
      select: { id: true }
    })

    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }

    // Check if user is the seller
    const product = await prisma.communityProduct.findFirst({
      where: {
        id: productId,
        communityId: community.id
      },
      select: {
        id: true,
        sellerId: true
      }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const isSeller = product.sellerId === session.user.id
    
    // Check if user is admin of community
    const communityMember = await prisma.communityMember.findFirst({
      where: {
        communityId: community.id,
        houseMembershipId: houseMembership.id,
        role: { in: ['OWNER', 'ADMIN'] }
      },
      select: { id: true }
    })

    if (!isSeller && !communityMember) {
      return NextResponse.json({ error: 'Only seller or admin can delete product' }, { status: 403 })
    }

    // Soft delete - update status to DISCONTINUED
    await prisma.communityProduct.update({
      where: { id: productId },
      data: { status: 'DISCONTINUED' }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Product deleted successfully' 
    })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}