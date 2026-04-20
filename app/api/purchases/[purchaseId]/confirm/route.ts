// app/api/purchases/[purchaseId]/confirm/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: { purchaseId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { purchaseId } = params
    const body = await req.json()
    const { paymentIntentId } = body

    // Update purchase status
    const purchase = await prisma.communityPurchase.update({
      where: { id: purchaseId },
      data: {
        status: 'COMPLETED',
        paymentId: paymentIntentId,
      },
      include: {
        product: true
      }
    })

    // Update inventory
    if (purchase.product.inventory !== null) {
      await prisma.communityProduct.update({
        where: { id: purchase.productId },
        data: {
          inventory: { decrement: purchase.quantity },
          salesCount: { increment: purchase.quantity },
          revenue: { increment: purchase.totalAmount }
        }
      })
    } else {
      await prisma.communityProduct.update({
        where: { id: purchase.productId },
        data: {
          salesCount: { increment: purchase.quantity },
          revenue: { increment: purchase.totalAmount }
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error confirming purchase:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}