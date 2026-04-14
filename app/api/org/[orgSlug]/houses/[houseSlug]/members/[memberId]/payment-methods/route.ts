// app/api/org/[orgSlug]/houses/[houseSlug]/members/[memberId]/payment-methods/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

export async function GET(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string; memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const member = await prisma.houseMembership.findFirst({
      where: {
        id: params.memberId,
        house: {
          slug: params.houseSlug,
          organization: { slug: params.orgSlug }
        }
      },
      include: {
        membership: {
          include: {
            user: {
              include: {
                customer: true
              }
            }
          }
        }
      }
    })

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    const customerId = member.membership?.user?.customer?.stripeCustomerId

    if (!customerId) {
      return NextResponse.json({ paymentMethods: [], defaultPaymentMethodId: null })
    }

    // Get customer with default payment method
    const customer = await stripe.customers.retrieve(customerId)
    const defaultPaymentMethodId = (customer as any).invoice_settings?.default_payment_method

    // Get all payment methods
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card'
    })

    const methods = paymentMethods.data.map(method => ({
      id: method.id,
      brand: method.card?.brand,
      last4: method.card?.last4,
      expMonth: method.card?.exp_month,
      expYear: method.card?.exp_year,
      isDefault: method.id === defaultPaymentMethodId,
      funding: method.card?.funding,
      country: method.card?.country
    }))

    return NextResponse.json({
      paymentMethods: methods,
      defaultPaymentMethodId,
      hasPaymentMethod: methods.length > 0
    })
  } catch (error) {
    console.error('Get payment methods error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}