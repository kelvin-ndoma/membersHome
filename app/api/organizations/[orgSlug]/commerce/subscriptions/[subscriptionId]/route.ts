import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireOrgAccess } from "@/lib/auth"
import { stripe } from "@/lib/stripe/client"

export async function GET(
  req: Request,
  { params }: { params: { orgSlug: string; subscriptionId: string } }
) {
  try {
    await requireOrgAccess(params.orgSlug)

    const organization = await prisma.organization.findUnique({
      where: { slug: params.orgSlug },
      select: { id: true, stripeCustomerId: true },
    })

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    try {
      const subscription = await stripe.subscriptions.retrieve(params.subscriptionId)

      const invoices = await stripe.invoices.list({
        subscription: params.subscriptionId,
        limit: 12,
      })

      const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
        subscription: params.subscriptionId,
      })

      return NextResponse.json({
        subscription,
        invoices: invoices.data,
        upcomingInvoice,
      })
    } catch (error) {
      console.error("Error fetching subscription details:", error)
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error("Error fetching subscription:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { orgSlug: string; subscriptionId: string } }
) {
  try {
    await requireOrgAccess(params.orgSlug)

    const body = await req.json()
    const { action, priceId } = body

    const organization = await prisma.organization.findUnique({
      where: { slug: params.orgSlug },
      select: { id: true },
    })

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    let result

    switch (action) {
      case "cancel":
        result = await stripe.subscriptions.update(params.subscriptionId, {
          cancel_at_period_end: true,
        })
        break
      case "resume":
        result = await stripe.subscriptions.update(params.subscriptionId, {
          cancel_at_period_end: false,
        })
        break
      case "update_plan":
        if (!priceId) {
          return NextResponse.json(
            { error: "Price ID is required" },
            { status: 400 }
          )
        }
        result = await stripe.subscriptions.update(params.subscriptionId, {
          items: [{ id: (await stripe.subscriptions.retrieve(params.subscriptionId)).items.data[0].id, price: priceId }],
          proration_behavior: "create_prorations",
        })
        break
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        )
    }

    if (action === "cancel") {
      await prisma.organization.update({
        where: { id: organization.id },
        data: { plan: "FREE" },
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error updating subscription:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { orgSlug: string; subscriptionId: string } }
) {
  try {
    await requireOrgAccess(params.orgSlug)

    const organization = await prisma.organization.findUnique({
      where: { slug: params.orgSlug },
      select: { id: true },
    })

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    await stripe.subscriptions.cancel(params.subscriptionId)

    await prisma.organization.update({
      where: { id: organization.id },
      data: {
        plan: "FREE",
        stripeSubscriptionId: null,
      },
    })

    return NextResponse.json(
      { message: "Subscription cancelled successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error cancelling subscription:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}