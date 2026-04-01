// app/api/auth/check-role/route.ts
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized", isPlatformAdmin: false },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { platformRole: true }
    })

    const isPlatformAdmin = user?.platformRole === "PLATFORM_ADMIN"

    return NextResponse.json({
      isPlatformAdmin,
      platformRole: user?.platformRole
    })
  } catch (error) {
    console.error("Error checking role:", error)
    return NextResponse.json(
      { error: "Internal server error", isPlatformAdmin: false },
      { status: 500 }
    )
  }
}