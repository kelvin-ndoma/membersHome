import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"
import { registerUserSchema } from "@/lib/validations/user"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    const validatedData = registerUserSchema.safeParse(body)
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validatedData.error.errors },
        { status: 400 }
      )
    }

    const { email, password, name } = validatedData.data

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        name,
        platformRole: "USER",
      },
      select: {
        id: true,
        email: true,
        name: true,
        platformRole: true,
        createdAt: true,
      },
    })

    return NextResponse.json(
      { message: "User created successfully", user },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}