import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { hashToken } from "@/lib/utils/tokens"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")
    const email = searchParams.get("email")

    console.log("========================================")
    console.log("🔍 Verifying invitation")
    console.log("========================================")
    console.log("Token from URL:", token)
    console.log("Email from URL:", email)

    if (!token || !email) {
      return NextResponse.json(
        { error: "Missing token or email" },
        { status: 400 }
      )
    }

    const hashedToken = hashToken(token)
    console.log("Hashed token:", hashedToken)

    // Check if user exists with this email and invitation token
    const user = await prisma.user.findFirst({
      where: {
        email,
        invitationToken: hashedToken,
      },
    })

    console.log("User found:", user ? "Yes" : "No")
    if (user) {
      console.log("User ID:", user.id)
      console.log("User has password:", !!user.passwordHash)
      console.log("User invitation token:", user.invitationToken)
    }

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired invitation" },
        { status: 404 }
      )
    }

    // Check if user already has a password
    if (user.passwordHash) {
      return NextResponse.json(
        { error: "Account already exists. Please sign in." },
        { status: 400 }
      )
    }

    console.log("✅ Invitation verified for:", user.email)
    console.log("========================================")

    return NextResponse.json({
      valid: true,
      name: user.name,
      email: user.email,
    })
  } catch (error) {
    console.error("Error verifying invitation:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}