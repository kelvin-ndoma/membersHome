// app/api/stripe/portal/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { returnUrl } = await req.json()
    
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        customer: true,
      }
    })
    
    if (!user?.customer?.stripeCustomerId) {
      return NextResponse.json({ error: 'No Stripe customer found' }, { status: 400 })
    }
    
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.customer.stripeCustomerId,
      return_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    })
    
    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    console.error('Portal session error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}