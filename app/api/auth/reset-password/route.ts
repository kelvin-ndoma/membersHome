// app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Find user with token
    const user = await prisma.user.findFirst({
      where: {
        invitationToken: token,
        invitationSentAt: {
          gte: new Date(Date.now() - 1 * 60 * 60 * 1000), // Token valid for 1 hour
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        invitationToken: null,
      },
    })

    // Log password reset
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        action: 'PASSWORD_RESET',
        entityType: 'USER',
        entityId: user.id,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}