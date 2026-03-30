import Stripe from "stripe"

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set")
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
  typescript: true,
})

export interface CreateCheckoutSessionParams {
  customerId?: string
  customerEmail?: string
  priceId: string
  successUrl: string
  cancelUrl: string
  quantity?: number
  metadata?: Record<string, string>
}

export async function createCheckoutSession(params: CreateCheckoutSessionParams) {
  const { customerId, customerEmail, priceId, successUrl, cancelUrl, quantity = 1, metadata } = params

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    customer_email: customerEmail,
    line_items: [
      {
        price: priceId,
        quantity,
      },
    ],
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
  })

  return session
}

export interface CreateSubscriptionSessionParams {
  customerId?: string
  customerEmail?: string
  priceId: string
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
}

export async function createSubscriptionSession(params: CreateSubscriptionSessionParams) {
  const { customerId, customerEmail, priceId, successUrl, cancelUrl, metadata } = params

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    customer_email: customerEmail,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
  })

  return session
}

export interface CreateCustomerParams {
  email: string
  name?: string
  phone?: string
  metadata?: Record<string, string>
}

export async function createCustomer(params: CreateCustomerParams) {
  const { email, name, phone, metadata } = params

  const customer = await stripe.customers.create({
    email,
    name,
    phone,
    metadata,
  })

  return customer
}

export async function getOrCreateCustomer(email: string, name?: string) {
  const customers = await stripe.customers.list({
    email,
    limit: 1,
  })

  if (customers.data.length > 0) {
    return customers.data[0]
  }

  return createCustomer({ email, name })
}

export async function createPaymentIntent(
  amount: number,
  currency: string,
  customerId?: string,
  metadata?: Record<string, string>
) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: currency.toLowerCase(),
    customer: customerId,
    metadata,
    automatic_payment_methods: {
      enabled: true,
    },
  })

  return paymentIntent
}

export async function refundPayment(
  paymentIntentId: string,
  amount?: number,
  reason?: "duplicate" | "fraudulent" | "requested_by_customer"
) {
  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: amount ? Math.round(amount * 100) : undefined,
    reason,
  })

  return refund
}