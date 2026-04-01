// app/api/debug/check-application/route.ts
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
  const email = searchParams.get("email")

  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 })
  }

  const applications = await prisma.membershipApplication.findMany({
    where: { email },
    include: {
      membershipPlan: {
        include: { house: true }
      }
    },
    orderBy: { createdAt: "desc" }
  })

  return NextResponse.json({
    email,
    applications: applications.map(app => ({
      id: app.id,
      status: app.status,
      planName: app.membershipPlan.name,
      planId: app.membershipPlan.id,
      houseId: app.membershipPlan.houseId,
      houseName: app.membershipPlan.house?.name,
      houseExists: !!app.membershipPlan.house,
      createdAt: app.createdAt
    }))
  })
}