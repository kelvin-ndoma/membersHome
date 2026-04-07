// app/api/public/select-plan/[token]/create-payment-intent/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { hashToken } from "@/lib/utils/tokens"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params
    const body = await req.json()
    const { planId } = body

    // Hash the incoming token to compare with stored hash
    const hashedToken = hashToken(token)

    // Find the application by token
    const application = await prisma.membershipApplication.findFirst({
      where: {
        reviewToken: hashedToken,
        status: "REVIEWING",
      },
      include: {
        membershipPlan: true,
      },
    })

    if (!application) {
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 })
    }

    const plan = await prisma.membershipPlan.findUnique({
      where: { id: planId || application.membershipPlanId },
    })

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 })
    }

    // Calculate amount (including setup fee if not waived)
    const amount = plan.amount + (plan.setupFee || 0)

    // Create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: plan.currency.toLowerCase(),
      metadata: {
        applicationId: application.id,
        planId: plan.id,
        type: "membership_deposit",
      },
      capture_method: "manual", // Don't capture immediately, only authorize
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    })
  } catch (error) {
    console.error("Error creating payment intent:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}