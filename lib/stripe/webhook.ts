import { NextRequest } from "next/server"
import Stripe from "stripe"
import { stripe } from "./client"
import { prisma } from "@/lib/db"

export async function verifyStripeWebhook(
  req: NextRequest,
  signature: string | null
): Promise<Stripe.Event | null> {
  if (!signature) {
    return null
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not set")
  }

  const body = await req.text()

  try {
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    return event
  } catch (error) {
    console.error("Webhook signature verification failed:", error)
    return null
  }
}

export async function handleCheckoutSessionCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session

  if (session.metadata?.ticketPurchaseId) {
    await prisma.ticketPurchase.update({
      where: { id: session.metadata.ticketPurchaseId },
      data: {
        paymentStatus: "SUCCEEDED",
        paidAt: new Date(),
        paymentMethod: "stripe",
      },
    })
  }

  if (session.metadata?.organizationId && session.metadata?.subscriptionId) {
    await prisma.organization.update({
      where: { id: session.metadata.organizationId },
      data: {
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: session.subscription as string,
      },
    })
  }
}

export async function handlePaymentIntentSucceeded(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent

  if (paymentIntent.metadata?.ticketPurchaseId) {
    await prisma.payment.create({
      data: {
        stripePaymentId: paymentIntent.id,
        stripeCustomerId: paymentIntent.customer as string,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: "SUCCEEDED",
        paidAt: new Date(),
        userId: paymentIntent.metadata.userId || "",
        organizationId: paymentIntent.metadata.organizationId || "",
        ticketPurchaseId: paymentIntent.metadata.ticketPurchaseId,
      },
    })
  }
}

export async function handleInvoicePaid(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice

  if (invoice.metadata?.organizationId) {
    await prisma.organization.update({
      where: { id: invoice.metadata.organizationId },
      data: {
        plan: invoice.metadata.plan as any,
      },
    })
  }
}

export async function handleCustomerSubscriptionDeleted(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription

  const organization = await prisma.organization.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  })

  if (organization) {
    await prisma.organization.update({
      where: { id: organization.id },
      data: {
        plan: "FREE",
        stripeSubscriptionId: null,
      },
    })
  }
}

export async function processStripeWebhook(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutSessionCompleted(event)
      break
    case "payment_intent.succeeded":
      await handlePaymentIntentSucceeded(event)
      break
    case "invoice.paid":
      await handleInvoicePaid(event)
      break
    case "customer.subscription.deleted":
      await handleCustomerSubscriptionDeleted(event)
      break
    default:
      console.log(`Unhandled event type: ${event.type}`)
  }
}