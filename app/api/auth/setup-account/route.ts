import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { hashToken } from "@/lib/utils/tokens"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token, email, name, password } = body

    console.log("========================================")
    console.log("🔧 Setting up account")
    console.log("========================================")
    console.log("Token from request:", token)
    console.log("Email from request:", email)
    console.log("Name:", name)

    if (!token || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const hashedToken = hashToken(token)
    console.log("Hashed token:", hashedToken)

    // Find user with matching email and invitation token
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

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name || user.name,
        passwordHash: hashedPassword,
        invitationToken: null,
        invitationAcceptedAt: new Date(),
      },
    })

    console.log("✅ Account setup complete for:", email)
    console.log("========================================")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error setting up account:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}