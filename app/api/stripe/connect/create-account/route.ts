// app/api/stripe/connect/create-account/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { type, entityId, returnUrl } = body

    let accountId: string | null = null
    let email: string = session.user.email || ''

    if (type === 'organization') {
      // First check if user is org admin
      const membership = await prisma.membership.findFirst({
        where: {
          userId: session.user.id,
          organizationId: entityId,
          role: { in: ['ORG_OWNER', 'ORG_ADMIN'] }
        }
      })
      
      if (!membership) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
      
      const org = await prisma.organization.findUnique({
        where: { id: entityId }
      })
      
      if (!org) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
      }
      
      accountId = org.stripeConnectAccountId
      email = org.billingEmail || session.user.email || ''
    } 
    else if (type === 'house') {
      // First find the house and check if user has access
      const house = await prisma.house.findUnique({
        where: { id: entityId },
        include: {
          organization: true
        }
      })
      
      if (!house) {
        return NextResponse.json({ error: 'House not found' }, { status: 404 })
      }
      
      // Check if user is org admin
      const orgMembership = await prisma.membership.findFirst({
        where: {
          userId: session.user.id,
          organizationId: house.organizationId,
          role: { in: ['ORG_OWNER', 'ORG_ADMIN'] }
        }
      })
      
      // Check if user is house admin
      const houseMembership = await prisma.houseMembership.findFirst({
        where: {
          houseId: house.id,
          membership: {
            userId: session.user.id
          },
          role: { in: ['HOUSE_ADMIN', 'HOUSE_MANAGER'] }
        }
      })
      
      if (!orgMembership && !houseMembership) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
      
      accountId = house.stripeConnectAccountId
    } 
    else if (type === 'user') {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id }
      })
      accountId = user?.stripeConnectAccountId ?? null
    }

    // Create or retrieve connected account
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: email,
        capabilities: {
          transfers: { requested: true },
        },
        business_type: type === 'user' ? 'individual' : 'company',
        metadata: {
          platform: 'membershome',
          entityType: type,
          entityId: entityId,
          userId: session.user.id
        }
      })
      accountId = account.id

      // Save account ID - ensure we only pass string, never undefined
      if (type === 'organization' && accountId) {
        await prisma.organization.update({
          where: { id: entityId },
          data: { 
            stripeConnectAccountId: accountId, 
            stripeAccountStatus: 'pending' 
          }
        })
      } else if (type === 'house' && accountId) {
        await prisma.house.update({
          where: { id: entityId },
          data: { 
            stripeConnectAccountId: accountId, 
            stripeAccountStatus: 'pending' 
          }
        })
      } else if (type === 'user' && accountId) {
        await prisma.user.update({
          where: { id: session.user.id },
          data: { 
            stripeConnectAccountId: accountId, 
            stripeAccountStatus: 'pending' 
          }
        })
      }
    }

    // Ensure accountId is a string before creating account link
    if (!accountId) {
      return NextResponse.json({ error: 'Failed to create or retrieve account' }, { status: 500 })
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXTAUTH_URL}/settings/payouts?refresh=true`,
      return_url: returnUrl || `${process.env.NEXTAUTH_URL}/settings/payouts?success=true`,
      type: 'account_onboarding',
    })

    return NextResponse.json({ 
      success: true, 
      url: accountLink.url,
      accountId: accountId
    })
  } catch (error) {
    console.error('Error creating account link:', error)
    return NextResponse.json(
      { error: 'Failed to create onboarding link' },
      { status: 500 }
    )
  }
}