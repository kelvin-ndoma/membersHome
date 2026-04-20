// app/api/seller/orders/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') // 'completed', 'pending', 'shipped', 'all'
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {
      product: {
        sellerId: session.user.id
      }
    }

    if (status && status !== 'all') {
      where.status = status.toUpperCase()
    }

    const orders = await prisma.communityPurchase.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            type: true,
            isDigital: true,
            requiresShipping: true,
            community: {
              select: {
                id: true,
                name: true,
                slug: true,
                house: {
                  select: {
                    slug: true,
                    organization: {
                      select: { slug: true }
                    }
                  }
                }
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
      take: limit,
      skip: offset
    })

    const total = await prisma.communityPurchase.count({ where })

    return NextResponse.json({
      success: true,
      orders: orders.map(o => ({
        id: o.id,
        productName: o.product.name,
        productId: o.product.id,
        quantity: o.quantity,
        unitPrice: o.unitPrice,
        totalAmount: o.totalAmount,
        houseFeeAmount: o.houseFeeAmount,
        sellerPayoutAmount: o.sellerPayoutAmount,
        status: o.status,
        shippingAddress: o.shippingAddress,
        buyerName: o.buyer.name,
        buyerEmail: o.buyer.email,
        createdAt: o.createdAt,
        sellerPaidAt: o.sellerPaidAt,
        isDigital: o.product.isDigital,
        requiresShipping: o.product.requiresShipping,
        communityName: o.product.community.name,
        communitySlug: o.product.community.slug,
        houseSlug: o.product.community.house.slug,
        orgSlug: o.product.community.house.organization.slug
      })),
      total
    })
  } catch (error) {
    console.error('Error fetching seller orders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}