// app/api/auth/accept-invite/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, password } = body

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    console.log('Accepting invite with token:', token.substring(0, 20) + '...')

    // Check User model for org owner invitations
    const user = await prisma.user.findFirst({
      where: {
        invitationToken: token,
        invitationSentAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        memberships: {
          where: { role: 'ORG_OWNER' },
          include: {
            organization: {
              include: {
                houses: {
                  take: 1,
                  orderBy: { createdAt: 'asc' }
                }
              }
            }
          }
        }
      }
    })

    if (user) {
      console.log('Found org owner invitation for:', user.email)

      // Prepare update data
      const updateData: any = {
        invitationAcceptedAt: new Date(),
        invitationToken: null,
        emailVerified: user.emailVerified || new Date(),
      }

      // If password is provided, hash and set it
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 12)
        updateData.passwordHash = hashedPassword
      }

      // Update user
      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      })

      const org = user.memberships[0]?.organization
      const house = org?.houses[0]

      // Ensure membership is active
      if (org) {
        await prisma.membership.updateMany({
          where: {
            userId: user.id,
            organizationId: org.id,
          },
          data: { status: 'ACTIVE' }
        })
      }

      // Ensure house membership is active
      if (house) {
        const membership = await prisma.membership.findFirst({
          where: {
            userId: user.id,
            organizationId: org.id,
          }
        })

        if (membership) {
          await prisma.houseMembership.updateMany({
            where: {
              membershipId: membership.id,
              houseId: house.id,
            },
            data: {
              status: 'ACTIVE',
              acceptanceToken: null,
              acceptanceTokenUsedAt: new Date(),
            }
          })
        }
      }

      // Log the acceptance
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          userEmail: user.email,
          action: 'INVITATION_ACCEPTED',
          entityType: 'USER',
          entityId: user.id,
          organizationId: org?.id,
          metadata: { role: 'ORG_OWNER' }
        }
      })

      const redirectUrl = org ? `/org/${org.slug}/dashboard` : '/dashboard'

      return NextResponse.json({
        success: true,
        message: 'Invitation accepted successfully!',
        redirectUrl,
        email: user.email,
      })
    }

    // Check HouseMembership for house manager/staff invitations
    const houseMembership = await prisma.houseMembership.findFirst({
      where: {
        acceptanceToken: token,
        acceptanceTokenSentAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        membership: {
          include: {
            user: true,
            organization: true,
          },
        },
        house: {
          include: {
            organization: true,
          },
        },
      }
    })

    if (houseMembership) {
      const membershipUser = houseMembership.membership.user
      console.log('Found house membership invitation for:', membershipUser.email)

      // Update user if password provided
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 12)
        await prisma.user.update({
          where: { id: membershipUser.id },
          data: {
            passwordHash: hashedPassword,
            emailVerified: membershipUser.emailVerified || new Date(),
          },
        })
      }

      // Update house membership
      await prisma.houseMembership.update({
        where: { id: houseMembership.id },
        data: {
          status: 'ACTIVE',
          acceptanceTokenUsedAt: new Date(),
          acceptanceToken: null,
          portalActivatedAt: new Date(),
        }
      })

      // Create member profile if doesn't exist
      await prisma.memberProfile.upsert({
        where: { houseMembershipId: houseMembership.id },
        update: {},
        create: {
          houseMembershipId: houseMembership.id,
          userId: membershipUser.id,
          houseId: houseMembership.houseId,
        }
      })

      // Create member dashboard
      await prisma.memberDashboard.upsert({
        where: { houseMembershipId: houseMembership.id },
        update: {},
        create: {
          houseMembershipId: houseMembership.id,
          userId: membershipUser.id,
          houseId: houseMembership.houseId,
        }
      })

      // Log acceptance
      await prisma.auditLog.create({
        data: {
          userId: membershipUser.id,
          userEmail: membershipUser.email,
          action: 'MEMBER_INVITATION_ACCEPTED',
          entityType: 'HOUSE_MEMBERSHIP',
          entityId: houseMembership.id,
          organizationId: houseMembership.house.organizationId,
          houseId: houseMembership.houseId,
        }
      })

      const org = houseMembership.house.organization
      const house = houseMembership.house

      return NextResponse.json({
        success: true,
        message: 'House invitation accepted successfully!',
        redirectUrl: `/org/${org.slug}/houses/${house.slug}/dashboard`,
        email: membershipUser.email,
      })
    }

    return NextResponse.json(
      { error: 'Invalid or expired invitation token' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Accept invite error:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}