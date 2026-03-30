import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { stripe } from "@/lib/stripe/client"
import { prisma } from "@/lib/db"
import { processStripeWebhook } from "@/lib/stripe/webhook"

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get("stripe-signature")

  if (!signature) {
    return NextResponse.json(
      { error: "No signature provided" },
      { status: 400 }
    )
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    )
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    )
  }

  try {
    await processStripeWebhook(event)
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    )
  }
}