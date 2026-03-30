import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await getServerSession(authOptions)
  return NextResponse.json({ 
    hasSession: !!session,
    user: session?.user,
    timestamp: new Date().toISOString()
  })
}