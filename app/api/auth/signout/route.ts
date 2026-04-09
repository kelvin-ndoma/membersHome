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
    
    // Create response
    const response = NextResponse.json({ success: true })
    
    // Clear all auth-related cookies
    const cookiesToClear = [
      "next-auth.session-token",
      "next-auth.callback-url",
      "next-auth.csrf-token",
      "__Secure-next-auth.session-token",
      "__Host-next-auth.csrf-token"
    ]
    
    cookiesToClear.forEach(cookieName => {
      response.cookies.set(cookieName, "", {
        expires: new Date(0),
        path: "/",
      })
    })
    
    return response
  } catch (error) {
    console.error("Signout error:", error)
    // Still return success and clear cookies even if logging fails
    const response = NextResponse.json({ success: true })
    response.cookies.set("next-auth.session-token", "", { expires: new Date(0), path: "/" })
    return response
  }
}