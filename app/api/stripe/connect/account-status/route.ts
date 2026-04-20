// app/api/stripe/connect/account-status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const entityId = searchParams.get('entityId')

    let accountId: string | null = null
    let accountStatus: string | null = null

    if (type === 'organization' && entityId) {
      const org = await prisma.organization.findUnique({
        where: { id: entityId },
        select: { stripeConnectAccountId: true, stripeAccountStatus: true }
      })
      accountId = org?.stripeConnectAccountId || null
      accountStatus = org?.stripeAccountStatus || null
    } 
    else if (type === 'house' && entityId) {
      const house = await prisma.house.findUnique({
        where: { id: entityId },
        select: { stripeConnectAccountId: true, stripeAccountStatus: true }
      })
      accountId = house?.stripeConnectAccountId || null
      accountStatus = house?.stripeAccountStatus || null
    } 
    else if (type === 'user') {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { stripeConnectAccountId: true, stripeAccountStatus: true }
      })
      accountId = user?.stripeConnectAccountId || null
      accountStatus = user?.stripeAccountStatus || null
    }

    // If account exists, check real-time status from Stripe
    if (accountId) {
      try {
        const account = await stripe.accounts.retrieve(accountId)
        const isActive = account.charges_enabled && account.payouts_enabled
        
        if (isActive && accountStatus !== 'active') {
          // Update status in database
          if (type === 'organization' && entityId) {
            await prisma.organization.update({
              where: { id: entityId },
              data: { stripeAccountStatus: 'active' }
            })
          } else if (type === 'house' && entityId) {
            await prisma.house.update({
              where: { id: entityId },
              data: { stripeAccountStatus: 'active' }
            })
          } else if (type === 'user') {
            await prisma.user.update({
              where: { id: session.user.id },
              data: { stripeAccountStatus: 'active' }
            })
          }
          accountStatus = 'active'
        }
      } catch (error) {
        console.error('Error checking Stripe account:', error)
      }
    }

    return NextResponse.json({
      success: true,
      accountId,
      accountStatus: accountStatus || 'not_connected',
      isConnected: !!accountId,
      isActive: accountStatus === 'active'
    })
  } catch (error) {
    console.error('Error checking account status:', error)
    return NextResponse.json(
      { error: 'Failed to check account status' },
      { status: 500 }
    )
  }
}