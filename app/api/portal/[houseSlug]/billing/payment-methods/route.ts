// app/api/portal/[houseSlug]/billing/payment-methods/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

export async function POST(
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

    let customer = await prisma.customer.findUnique({
      where: { userId: session.user.id }
    })

    if (!customer?.stripeCustomerId) {
      const stripeCustomer = await stripe.customers.create({
        email: session.user.email!,
        name: session.user.name || undefined,
      })
      
      customer = await prisma.customer.upsert({
        where: { userId: session.user.id },
        update: { stripeCustomerId: stripeCustomer.id },
        create: {
          userId: session.user.id,
          stripeCustomerId: stripeCustomer.id
        }
      })
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: customer.stripeCustomerId,
      payment_method_types: ['card'],
      usage: 'off_session',
    })

    return NextResponse.json({
      clientSecret: setupIntent.client_secret
    })
  } catch (error) {
    console.error('Create setup intent error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { houseSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { paymentMethodId } = await req.json()

    await stripe.paymentMethods.detach(paymentMethodId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete payment method error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { houseSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { paymentMethodId } = await req.json()

    const customer = await prisma.customer.findUnique({
      where: { userId: session.user.id }
    })

    if (!customer?.stripeCustomerId) {
      return NextResponse.json({ error: 'No customer found' }, { status: 404 })
    }

    await stripe.customers.update(customer.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Set default payment method error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}