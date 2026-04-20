// app/api/portal/[houseSlug]/communities/[communityId]/products/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'
import { ObjectId } from 'mongodb'

export async function GET(
  req: NextRequest,
  { params }: { params: { houseSlug: string; communityId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { houseSlug, communityId } = params
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const type = searchParams.get('type')
    const sort = searchParams.get('sort')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    console.log("Fetching products for community:", communityId)

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

    console.log("Found community:", community.id)

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

    // Build where clause - make sure we're getting all products including newly created ones
    const where: any = {
      communityId: community.id,
      status: 'ACTIVE',
    }
    
    // Only filter by isPublished if it exists (for products that need approval)
    // For now, include all products since auto-approve is on
    // where.isPublished = true

    if (category && category !== 'all') {
      where.category = category
    }

    if (type && type !== 'all') {
      where.type = type
    }

    console.log("Query where clause:", where)

    // Build order by
    let orderBy: any = { createdAt: 'desc' }
    if (sort === 'price_asc') orderBy = { price: 'asc' }
    if (sort === 'price_desc') orderBy = { price: 'desc' }
    if (sort === 'popular') orderBy = { salesCount: 'desc' }

    // Get products
    const products = await prisma.communityProduct.findMany({
      where,
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        _count: {
          select: {
            purchases: true
          }
        }
      },
      orderBy,
      take: limit,
      skip: offset
    })

    console.log(`Found ${products.length} products`)

    // Get unique categories
    const categories = await prisma.communityProduct.findMany({
      where: {
        communityId: community.id,
        status: 'ACTIVE',
      },
      select: {
        category: true
      },
      distinct: ['category']
    })

    // Get stats
    const stats = await prisma.communityProduct.aggregate({
      where: {
        communityId: community.id,
        status: 'ACTIVE',
      },
      _sum: {
        salesCount: true,
        revenue: true
      },
      _count: true
    })

    return NextResponse.json({
      success: true,
      products: products.map(product => ({
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
        salesCount: product._count.purchases,
        revenue: product.revenue,
        seller: {
          id: product.seller.id,
          name: product.seller.name,
          image: product.seller.image
        },
        createdAt: product.createdAt
      })),
      categories: categories.map(c => c.category).filter(Boolean),
      stats: {
        totalProducts: stats._count,
        totalSales: stats._sum.salesCount || 0,
        totalRevenue: stats._sum.revenue || 0
      },
      houseFeePercent: house.marketplaceFeePercent || 5
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { houseSlug: string; communityId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { houseSlug, communityId } = params
    const body = await req.json()
    const {
      name,
      description,
      price,
      compareAtPrice,
      currency,
      type,
      category,
      images,
      inventory,
      isDigital,
      fileUrl,
      downloadLimit,
      requiresShipping
    } = body

    console.log("Creating product:", { name, price, type, communityId })

    if (!name || !price) {
      return NextResponse.json(
        { error: 'Name and price are required' },
        { status: 400 }
      )
    }

    if (price <= 0) {
      return NextResponse.json(
        { error: 'Price must be greater than 0' },
        { status: 400 }
      )
    }

    // Get house with fee settings
    const house = await prisma.house.findFirst({
      where: { slug: houseSlug },
      select: { id: true, marketplaceFeePercent: true, autoApproveProducts: true }
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
      return NextResponse.json(
        { error: 'Active membership required to sell products' },
        { status: 403 }
      )
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
      return NextResponse.json({ error: 'Must be a member to sell products' }, { status: 403 })
    }

    // Calculate fees
    const houseFeePercent = house.marketplaceFeePercent || 5
    const platformFeePercent = 0
    const sellerPayoutAmount = price - (price * houseFeePercent / 100) - (price * platformFeePercent / 100)
    const houseEarnings = price * houseFeePercent / 100
    const platformEarnings = price * platformFeePercent / 100

    // Create product
    const product = await prisma.communityProduct.create({
      data: {
        communityId: community.id,
        sellerId: session.user.id,
        name,
        description: description || null,
        price,
        compareAtPrice: compareAtPrice || null,
        currency: currency || 'USD',
        type: type || 'PHYSICAL',
        category: category || null,
        images: images || [],
        inventory: inventory ? parseInt(inventory) : null,
        isDigital: isDigital || false,
        fileUrl: fileUrl || null,
        downloadLimit: downloadLimit || 0,
        requiresShipping: requiresShipping || false,
        isPublished: true, // Auto-publish for now
        status: 'ACTIVE',
        houseFeePercent,
        platformFeePercent,
        sellerPayoutAmount,
        houseEarnings,
        platformEarnings
      },
      select: {
        id: true,
        name: true,
        price: true,
        type: true,
        isPublished: true,
        sellerPayoutAmount: true,
        houseEarnings: true,
        createdAt: true
      }
    })

    console.log("Product created successfully:", product.id)

    return NextResponse.json({
      success: true,
      product,
      message: `Item listed successfully! You'll receive ${product.sellerPayoutAmount} after ${houseFeePercent}% house fee`
    })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}