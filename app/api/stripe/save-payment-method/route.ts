// app/api/stripe/save-payment-method/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { paymentMethodId } = await req.json()

    if (!paymentMethodId) {
      return NextResponse.json({ error: 'Payment method ID required' }, { status: 400 })
    }

    // Get or create Stripe customer
    let customer = await prisma.customer.findUnique({
      where: { userId: session.user.id }
    })

    if (!customer?.stripeCustomerId) {
      const stripeCustomer = await stripe.customers.create({
        email: session.user.email!,
        name: session.user.name || undefined,
      })
      
      customer = await prisma.customer.create({
        data: {
          userId: session.user.id,
          stripeCustomerId: stripeCustomer.id
        }
      })
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customer.stripeCustomerId,
    })

    // Set as default payment method
    await stripe.customers.update(customer.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Save payment method error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}