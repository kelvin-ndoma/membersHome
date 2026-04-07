// app/api/debug/check-applications/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"

interface ApplicationWithPlan {
  id: string
  firstName: string
  lastName: string
  email: string
  status: string
  createdAt: Date
  membershipPlan: {
    name: string
    house: {
      name: string
    } | null
  } | null
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const email = searchParams.get("email")

  // Get all applications
  const allApplications = await prisma.membershipApplication.findMany({
    include: {
      membershipPlan: {
        include: {
          house: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  }) as ApplicationWithPlan[]

  // Get applications for specific email if provided
  let emailApplications: ApplicationWithPlan[] = []
  if (email) {
    emailApplications = await prisma.membershipApplication.findMany({
      where: { email },
      include: {
        membershipPlan: {
          include: {
            house: true,
          },
        },
      },
    }) as ApplicationWithPlan[]
  }

  return NextResponse.json({
    totalApplications: allApplications.length,
    allApplications: allApplications.map(a => ({
      id: a.id,
      firstName: a.firstName,
      lastName: a.lastName,
      email: a.email,
      status: a.status,
      createdAt: a.createdAt,
      planName: a.membershipPlan?.name,
      houseName: a.membershipPlan?.house?.name,
    })),
    emailApplications: emailApplications.map(a => ({
      id: a.id,
      firstName: a.firstName,
      lastName: a.lastName,
      email: a.email,
      status: a.status,
    })),
  })
}