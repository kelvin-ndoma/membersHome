// app/api/public/select-plan/[token]/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { hashToken } from "@/lib/utils/tokens"

export async function GET(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params
    
    // Hash the incoming token to compare with stored hash
    const hashedToken = hashToken(token)

    const application = await prisma.membershipApplication.findFirst({
      where: {
        reviewToken: hashedToken,
        status: "REVIEWING",
      },
      include: {
        membershipPlan: {
          include: {
            house: true,
          },
        },
      },
    })

    if (!application) {
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 })
    }

    // Get all available plans for this house
    const plans = await prisma.membershipPlan.findMany({
      where: {
        houseId: application.membershipPlan.houseId,
        status: "ACTIVE",
      },
    })

    return NextResponse.json({
      plans,
      status: application.status,
      email: application.email,
    })
  } catch (error) {
    console.error("Error fetching plans:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params
    const body = await req.json()
    const { planId, paymentMethodId } = body
    
    // Hash the incoming token to compare with stored hash
    const hashedToken = hashToken(token)

    const application = await prisma.membershipApplication.findFirst({
      where: {
        reviewToken: hashedToken,
        status: "REVIEWING",
      },
    })

    if (!application) {
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 })
    }

    // Update application with selected plan and payment method
    await prisma.membershipApplication.update({
      where: { id: application.id },
      data: {
        selectedPlanId: planId,
        stripePaymentMethodId: paymentMethodId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error selecting plan:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}