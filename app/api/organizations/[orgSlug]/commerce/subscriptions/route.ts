import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireOrgAccess } from "@/lib/auth"
import { stripe, createSubscriptionSession } from "@/lib/stripe/client"

export async function GET(
  req: Request,
  { params }: { params: { orgSlug: string } }
) {
  try {
    const { membership } = await requireOrgAccess(params.orgSlug)

    const organization = await prisma.organization.findUnique({
      where: { slug: params.orgSlug },
      select: { id: true, name: true, plan: true, stripeCustomerId: true, stripeSubscriptionId: true },
    })

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    let subscriptionDetails = null
    if (organization.stripeSubscriptionId) {
      try {
        subscriptionDetails = await stripe.subscriptions.retrieve(organization.stripeSubscriptionId)
      } catch (error) {
        console.error("Error fetching subscription:", error)
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: membership.userId },
      select: { email: true },
    })

    const availablePlans = [
      { id: "price_free", name: "Free", price: 0, features: ["Up to 50 members", "Basic reports", "Email support"] },
      { id: "price_starter", name: "Starter", price: 29, features: ["Up to 500 members", "Advanced reports", "Priority support", "Ticket sales"] },
      { id: "price_professional", name: "Professional", price: 99, features: ["Unlimited members", "Custom branding", "API access", "Advanced analytics", "Multiple houses"] },
      { id: "price_enterprise", name: "Enterprise", price: 299, features: ["Everything in Professional", "Dedicated support", "SLA agreement", "Custom integrations"] },
    ]

    return NextResponse.json({
      currentPlan: organization.plan,
      subscription: subscriptionDetails,
      availablePlans,
      stripeCustomerId: organization.stripeCustomerId,
      userEmail: user?.email,
    })
  } catch (error) {
    console.error("Error fetching subscriptions:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(
  req: Request,
  { params }: { params: { orgSlug: string } }
) {
  try {
    const { membership } = await requireOrgAccess(params.orgSlug)

    const body = await req.json()
    const { priceId, successUrl, cancelUrl } = body

    const organization = await prisma.organization.findUnique({
      where: { slug: params.orgSlug },
      select: { id: true, name: true, stripeCustomerId: true },
    })

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: membership.userId },
      select: { email: true },
    })

    const session = await createSubscriptionSession({
      customerId: organization.stripeCustomerId || undefined,
      customerEmail: user?.email || undefined,
      priceId,
      successUrl: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/organization/${params.orgSlug}/billing?success=true`,
      cancelUrl: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/organization/${params.orgSlug}/billing?canceled=true`,
      metadata: {
        organizationId: organization.id,
        userId: membership.userId,
      },
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error("Error creating subscription session:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}