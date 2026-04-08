import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/options"
import { prisma } from "@/prisma/client"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (session?.user?.id) {
      // Log the signout action in audit log
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          userEmail: session.user.email || undefined,
          action: "SIGNOUT",
          entityType: "USER",
          entityId: session.user.id,
          metadata: {
            timestamp: new Date().toISOString(),
            ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
            userAgent: req.headers.get("user-agent"),
          }
        }
      })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Signout error:", error)
    return NextResponse.json({ success: true }) // Still return success
  }
}