// app/api/portal/[houseSlug]/billing/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

export async function GET(
  req: NextRequest,
  { params }: { params: { houseSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const house = await prisma.house.findFirst({
      where: { slug: params.houseSlug }
    })

    if (!house) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

    const memberAccess = await prisma.houseMembership.findFirst({
      where: {
        houseId: house.id,
        membership: { userId: session.user.id },
        status: 'ACTIVE'
      },
      include: {
        membershipItems: {
          where: { status: 'ACTIVE' },
          include: {
            membershipPlan: true,
            planPrice: true
          }
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    })

    if (!memberAccess) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 })
    }

    let paymentMethods: any[] = []
    let defaultPaymentMethodId: string | null = null
    
    const customer = await prisma.customer.findUnique({
      where: { userId: session.user.id }
    })

    if (customer?.stripeCustomerId) {
      try {
        const methods = await stripe.paymentMethods.list({
          customer: customer.stripeCustomerId,
          type: 'card'
        })
        
        const stripeCustomer = await stripe.customers.retrieve(customer.stripeCustomerId)
        defaultPaymentMethodId = (stripeCustomer as any).invoice_settings?.default_payment_method
        
        paymentMethods = methods.data.map(method => ({
          id: method.id,
          brand: method.card?.brand,
          last4: method.card?.last4,
          expMonth: method.card?.exp_month,
          expYear: method.card?.exp_year,
          isDefault: method.id === defaultPaymentMethodId
        }))
      } catch (error) {
        console.error('Failed to fetch Stripe payment methods:', error)
      }
    }

    return NextResponse.json({
      subscription: memberAccess.membershipItems[0] || null,
      payments: memberAccess.payments,
      invoices: memberAccess.invoices,
      paymentMethods,
      defaultPaymentMethodId
    })
  } catch (error) {
    console.error('Billing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}