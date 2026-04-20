// app/api/portal/[houseSlug]/seller/dashboard/stats/route.ts
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
      select: { id: true }
    })

    if (!house) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

    // Get all products by this seller in this house
    const products = await prisma.communityProduct.findMany({
      where: {
        sellerId: session.user.id,
        status: 'ACTIVE',
        community: {
          houseId: house.id
        }
      },
      select: {
        id: true,
        name: true,
        price: true,
        salesCount: true,
        revenue: true,
        status: true,
        isPublished: true,
        createdAt: true,
        community: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Get all purchases of seller's products in this house
    const purchases = await prisma.communityPurchase.findMany({
      where: {
        product: {
          sellerId: session.user.id,
          community: {
            houseId: house.id
          }
        },
        status: 'COMPLETED'
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            community: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    // Calculate totals
    const totalSales = products.reduce((sum, p) => sum + p.salesCount, 0)
    const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0)
    const activeListings = products.filter(p => p.isPublished).length
    const pendingListings = products.filter(p => !p.isPublished).length

    // Get payouts for this house
    const paidPayouts = await prisma.communityPurchase.aggregate({
      where: {
        product: { 
          sellerId: session.user.id,
          community: {
            houseId: house.id
          }
        },
        status: 'COMPLETED',
        sellerPaidAt: { not: null }
      },
      _sum: {
        sellerPayoutAmount: true
      }
    })

    const pendingPayouts = await prisma.communityPurchase.aggregate({
      where: {
        product: { 
          sellerId: session.user.id,
          community: {
            houseId: house.id
          }
        },
        status: 'COMPLETED',
        sellerPaidAt: null
      },
      _sum: {
        sellerPayoutAmount: true
      }
    })

    return NextResponse.json({
      success: true,
      stats: {
        totalProducts: products.length,
        activeListings,
        pendingListings,
        totalSales,
        totalRevenue,
        totalPayouts: paidPayouts._sum.sellerPayoutAmount || 0,
        pendingPayouts: pendingPayouts._sum.sellerPayoutAmount || 0
      },
      recentSales: purchases.map(p => ({
        id: p.id,
        productName: p.product.name,
        productId: p.product.id,
        quantity: p.quantity,
        totalAmount: p.totalAmount,
        sellerPayoutAmount: p.sellerPayoutAmount,
        buyerName: p.buyer.name,
        createdAt: p.createdAt,
        communityName: p.product.community.name,
        communitySlug: p.product.community.slug
      })),
      products: products.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        salesCount: p.salesCount,
        revenue: p.revenue,
        isPublished: p.isPublished,
        createdAt: p.createdAt,
        communityName: p.community.name,
        communitySlug: p.community.slug
      }))
    })
  } catch (error) {
    console.error('Error fetching seller stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}