import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/prisma/client"
import { sendVerificationEmail } from "@/lib/email"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user only (no organization)
    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        passwordHash: hashedPassword,
        platformRole: "USER", // Regular user, not org owner yet
      }
    })

    // Send verification email
    const verificationLink = `${process.env.NEXTAUTH_URL}/verify-email?token=${user.id}`
    await sendVerificationEmail(email, verificationLink, name || undefined)

    return NextResponse.json(
      { 
        message: "Registration successful. Please verify your email. You will be added to an organization by a platform admin.",
        userId: user.id
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "An error occurred during registration" },
      { status: 500 }
    )
  }
}