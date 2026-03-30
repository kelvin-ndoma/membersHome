import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get("email")

  if (!email) {
    return NextResponse.json({ exists: false })
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { 
      id: true, 
      email: true,
      passwordHash: true,
      createdAt: true
    }
  })

  return NextResponse.json({ 
    exists: !!user,
    hasPassword: user?.passwordHash !== null,
    user: user ? {
      id: user.id,
      email: user.email,
      hasPassword: user.passwordHash !== null
    } : null
  })
}