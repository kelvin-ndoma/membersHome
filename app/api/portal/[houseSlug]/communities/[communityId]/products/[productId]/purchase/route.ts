// app/api/portal/[houseSlug]/communities/[communityId]/products/[productId]/purchase/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'
import { ObjectId } from 'mongodb'
import { randomBytes } from 'crypto'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export async function POST(
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
    const { quantity, shippingAddress } = body

    // Get house with organization and Stripe accounts
    const house = await prisma.house.findFirst({
      where: { slug: houseSlug },
      include: {
        organization: {
          select: { 
            id: true,
            stripeConnectAccountId: true 
          }
        }
      }
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
      return NextResponse.json({ error: 'Must be a member to purchase' }, { status: 403 })
    }

    // Get product with seller info
    const product = await prisma.communityProduct.findFirst({
      where: {
        id: productId,
        communityId: community.id,
        status: 'ACTIVE',
        isPublished: true
      },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            stripeConnectAccountId: true,
            stripeAccountStatus: true
          }
        }
      }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const qty = quantity || 1
    const totalAmount = product.price * qty
    
    // Calculate fees
    const houseFeePercent = product.houseFeePercent ?? house.marketplaceFeePercent ?? 5
    const platformFeePercent = product.platformFeePercent ?? 0
    const houseFeeAmount = totalAmount * houseFeePercent / 100
    const platformFeeAmount = totalAmount * platformFeePercent / 100
    const sellerPayoutAmount = totalAmount - houseFeeAmount - platformFeeAmount

    // Check inventory
    if (product.inventory !== null && product.inventory < qty) {
      return NextResponse.json({ error: 'Insufficient inventory' }, { status: 400 })
    }

    // Check if user already purchased
    const existingPurchase = await prisma.communityPurchase.findFirst({
      where: {
        productId: product.id,
        buyerId: session.user.id,
        status: 'COMPLETED'
      }
    })
    if (existingPurchase) {
      return NextResponse.json({ error: 'You have already purchased this item' }, { status: 400 })
    }

    // Check if house has Stripe Connect account
    if (!house.stripeConnectAccountId || house.stripeAccountStatus !== 'active') {
      // For demo purposes, allow purchase without Stripe
      // In production, you would return an error
      console.warn('House Stripe account not configured - using demo mode')
      
      // Generate download token for digital products
      let downloadToken = null
      let downloadExpires = null
      if (product.isDigital) {
        downloadToken = randomBytes(32).toString('hex')
        downloadExpires = new Date()
        downloadExpires.setDate(downloadExpires.getDate() + 7)
      }

      // Create purchase record (demo mode)
      const purchase = await prisma.communityPurchase.create({
        data: {
          productId: product.id,
          buyerId: session.user.id,
          quantity: qty,
          unitPrice: product.price,
          totalAmount: totalAmount,
          currency: product.currency,
          shippingAddress: shippingAddress || null,
          downloadToken: downloadToken,
          downloadExpires: downloadExpires,
          status: 'COMPLETED',
          houseFeeAmount: houseFeeAmount,
          platformFeeAmount: platformFeeAmount,
          sellerPayoutAmount: sellerPayoutAmount,
          houseFeePercent: houseFeePercent,
          platformFeePercent: platformFeePercent
        }
      })

      // Update inventory
      if (product.inventory !== null) {
        await prisma.communityProduct.update({
          where: { id: product.id },
          data: {
            inventory: { decrement: qty },
            salesCount: { increment: qty },
            revenue: { increment: totalAmount }
          }
        })
      } else {
        await prisma.communityProduct.update({
          where: { id: product.id },
          data: {
            salesCount: { increment: qty },
            revenue: { increment: totalAmount }
          }
        })
      }

      return NextResponse.json({
        success: true,
        demoMode: true,
        purchase: {
          id: purchase.id,
          quantity: purchase.quantity,
          totalAmount: purchase.totalAmount,
          downloadToken: purchase.downloadToken,
          downloadExpires: purchase.downloadExpires,
          status: purchase.status
        },
        isDigital: product.isDigital,
        breakdown: {
          subtotal: totalAmount,
          houseFee: houseFeeAmount,
          houseFeePercent: houseFeePercent,
          sellerGets: sellerPayoutAmount
        }
      })
    }

    // Get or create customer
    let customer = await prisma.customer.findFirst({
      where: { userId: session.user.id }
    })

    let stripeCustomerId = customer?.stripeCustomerId

    if (!stripeCustomerId) {
      const stripeCustomer = await stripe.customers.create({
        email: session.user.email!,
        name: session.user.name || undefined,
        metadata: {
          userId: session.user.id
        }
      })
      stripeCustomerId = stripeCustomer.id
      
      await prisma.customer.create({
        data: {
          stripeCustomerId: stripeCustomerId,
          userId: session.user.id
        }
      })
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100),
      currency: product.currency.toLowerCase(),
      customer: stripeCustomerId,
      setup_future_usage: 'off_session',
      transfer_data: {
        destination: house.stripeConnectAccountId,
      },
      metadata: {
        productId: product.id,
        productName: product.name,
        sellerId: product.seller.id,
        sellerName: product.seller.name,
        houseId: house.id,
        houseName: house.name,
        communityId: community.id,
        quantity: qty.toString(),
        houseFeePercent: houseFeePercent.toString(),
        sellerPayoutAmount: sellerPayoutAmount.toString()
      }
    })

    // Generate download token for digital products
    let downloadToken = null
    let downloadExpires = null
    if (product.isDigital) {
      downloadToken = randomBytes(32).toString('hex')
      downloadExpires = new Date()
      downloadExpires.setDate(downloadExpires.getDate() + 7)
    }

    // Create purchase record
    const purchase = await prisma.communityPurchase.create({
      data: {
        productId: product.id,
        buyerId: session.user.id,
        quantity: qty,
        unitPrice: product.price,
        totalAmount: totalAmount,
        currency: product.currency,
        shippingAddress: shippingAddress || null,
        downloadToken: downloadToken,
        downloadExpires: downloadExpires,
        status: 'PENDING',
        houseFeeAmount: houseFeeAmount,
        platformFeeAmount: platformFeeAmount,
        sellerPayoutAmount: sellerPayoutAmount,
        houseFeePercent: houseFeePercent,
        platformFeePercent: platformFeePercent
      }
    })

    return NextResponse.json({
      requiresAction: true,
      clientSecret: paymentIntent.client_secret,
      purchaseId: purchase.id,
      isDigital: product.isDigital,
      breakdown: {
        subtotal: totalAmount,
        houseFee: houseFeeAmount,
        houseFeePercent: houseFeePercent,
        sellerGets: sellerPayoutAmount
      }
    })
  } catch (error) {
    console.error('Error processing purchase:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}