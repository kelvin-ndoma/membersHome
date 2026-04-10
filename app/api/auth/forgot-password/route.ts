// app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email/send'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      // Return success even if user doesn't exist (security)
      return NextResponse.json({
        success: true,
        message: 'If an account exists, a password reset email has been sent',
      })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const tokenExpiry = new Date(Date.now() + 1 * 60 * 60 * 1000) // 1 hour

    // Save token to user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        invitationToken: resetToken,
        invitationSentAt: new Date(),
      },
    })

    // Send reset email
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`
    
    await sendEmail({
      to: email,
      template: 'reset-password',
      data: {
        name: user.name || email,
        resetUrl,
      },
    })

    // Log request
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        action: 'PASSWORD_RESET_REQUESTED',
        entityType: 'USER',
        entityId: user.id,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'If an account exists, a password reset email has been sent',
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}