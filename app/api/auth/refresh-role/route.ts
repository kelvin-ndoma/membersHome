import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/options"
import { prisma } from "@/prisma/client"

export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 })
  }
  
  // Get fresh user from database
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { platformRole: true, email: true }
  })
  
  return NextResponse.json({
    sessionRole: session.user.platformRole,
    databaseRole: user?.platformRole,
    match: session.user.platformRole === user?.platformRole
  })
}