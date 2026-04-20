// app/api/portal/[houseSlug]/user/is-seller/route.ts
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

    // Check all products by this user in communities under this house (including non-active)
    const products = await prisma.communityProduct.findMany({
      where: {
        sellerId: session.user.id,
        community: {
          houseId: house.id
        }
      },
      select: {
        id: true,
        status: true,
        isPublished: true
      }
    })

    // Check purchases of user's products in this house
    const purchases = await prisma.communityPurchase.findMany({
      where: {
        product: {
          sellerId: session.user.id,
          community: {
            houseId: house.id
          }
        }
      },
      take: 1
    })

    const hasProducts = products.length > 0
    const hasSales = purchases.length > 0
    const isSeller = hasProducts || hasSales

    console.log('Seller check:', {
      userId: session.user.id,
      houseId: house.id,
      productCount: products.length,
      purchaseCount: purchases.length,
      isSeller
    })

    return NextResponse.json({
      isSeller,
      productCount: products.length,
      salesCount: purchases.length,
      products: products.map(p => ({ id: p.id, status: p.status, isPublished: p.isPublished }))
    })
  } catch (error) {
    console.error('Error checking seller status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}