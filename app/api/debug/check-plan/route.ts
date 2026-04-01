// app/api/debug/check-plan/route.ts
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const planId = searchParams.get("planId")

  if (!planId) {
    return NextResponse.json({ error: "planId required" }, { status: 400 })
  }

  const plan = await prisma.membershipPlan.findUnique({
    where: { id: planId },
    include: { house: true }
  })

  return NextResponse.json({
    planId: plan?.id,
    planName: plan?.name,
    houseId: plan?.houseId,
    house: plan?.house,
    houseExists: !!plan?.house
  })
}