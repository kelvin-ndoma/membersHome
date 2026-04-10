// app/api/auth/accept-member-invite/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be logged in to accept a membership invitation' },
        { status: 401 }
      )
    }

    const { token } = await req.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Invitation token is required' },
        { status: 400 }
      )
    }

    // Find house membership with token
    const houseMembership = await prisma.houseMembership.findFirst({
      where: {
        acceptanceToken: token,
        acceptanceTokenSentAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Valid for 7 days
        },
      },
      include: {
        membership: {
          include: {
            user: true,
          },
        },
        house: {
          include: {
            organization: true,
          },
        },
      },
    })

    if (!houseMembership) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation token' },
        { status: 400 }
      )
    }

    // Verify the user matches
    if (houseMembership.membership.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'This invitation is for a different user' },
        { status: 403 }
      )
    }

    // Update house membership
    await prisma.houseMembership.update({
      where: { id: houseMembership.id },
      data: {
        status: 'ACTIVE',
        acceptanceTokenUsedAt: new Date(),
        acceptanceToken: null,
        portalActivatedAt: new Date(),
      },
    })

    // Create member profile if doesn't exist
    await prisma.memberProfile.upsert({
      where: {
        houseMembershipId: houseMembership.id,
      },
      update: {},
      create: {
        houseMembershipId: houseMembership.id,
        userId: session.user.id,
        houseId: houseMembership.houseId,
      },
    })

    // Create member dashboard
    await prisma.memberDashboard.upsert({
      where: {
        houseMembershipId: houseMembership.id,
      },
      update: {},
      create: {
        houseMembershipId: houseMembership.id,
        userId: session.user.id,
        houseId: houseMembership.houseId,
      },
    })

    // Log acceptance
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: 'MEMBER_INVITATION_ACCEPTED',
        entityType: 'HOUSE_MEMBERSHIP',
        entityId: houseMembership.id,
        organizationId: houseMembership.house.organizationId,
        houseId: houseMembership.houseId,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Membership invitation accepted successfully',
      redirectUrl: `/portal/${houseMembership.house.slug}`,
    })
  } catch (error) {
    console.error('Accept member invite error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}