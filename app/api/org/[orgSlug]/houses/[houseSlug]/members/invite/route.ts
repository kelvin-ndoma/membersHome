// app/api/org/[orgSlug]/houses/[houseSlug]/members/invite/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email/send'
import crypto from 'crypto'

export async function POST(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email, name, role, sendInviteEmail } = await req.json()

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      )
    }

    // Validate role
    if (!['HOUSE_MANAGER', 'HOUSE_ADMIN', 'HOUSE_STAFF', 'HOUSE_MEMBER'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Define role label early
    const roleLabel = role === 'HOUSE_MANAGER' ? 'House Manager' : 
                      role === 'HOUSE_ADMIN' ? 'House Admin' : 
                      role === 'HOUSE_STAFF' ? 'House Staff' : 'Member'
    
    const isStaff = ['HOUSE_MANAGER', 'HOUSE_ADMIN', 'HOUSE_STAFF'].includes(role)

    const house = await prisma.house.findFirst({
      where: {
        slug: params.houseSlug,
        organization: { slug: params.orgSlug }
      },
      include: {
        organization: true,
        members: {
          where: {
            membership: { userId: session.user.id },
            role: { in: ['HOUSE_MANAGER', 'HOUSE_ADMIN'] }
          }
        }
      }
    })

    if (!house) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

    // Check if user has permission to invite
    const isOrgAdmin = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organizationId: house.organizationId,
        role: { in: ['ORG_OWNER', 'ORG_ADMIN'] }
      }
    })

    if (house.members.length === 0 && !isOrgAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    // Check if user already exists and is a member
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      const existingMembership = await prisma.membership.findFirst({
        where: {
          userId: existingUser.id,
          organizationId: house.organizationId
        }
      })

      if (existingMembership) {
        const existingHouseMember = await prisma.houseMembership.findFirst({
          where: {
            houseId: house.id,
            membershipId: existingMembership.id
          }
        })

        if (existingHouseMember) {
          return NextResponse.json(
            { error: 'User is already a member of this house' },
            { status: 400 }
          )
        }
      }
    }

    // Generate invitation token
    const inviteToken = crypto.randomBytes(32).toString('hex')

    // Find or create user
    let user = existingUser

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          invitationToken: inviteToken,
          invitationSentAt: new Date(),
        }
      })
    } else {
      // Update existing user with invitation token
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          invitationToken: inviteToken,
          invitationSentAt: new Date(),
        }
      })
    }

    // Get or create organization membership
    let membership = await prisma.membership.findFirst({
      where: {
        userId: user.id,
        organizationId: house.organizationId
      }
    })

    if (!membership) {
      membership = await prisma.membership.create({
        data: {
          userId: user.id,
          organizationId: house.organizationId,
          role: 'MEMBER',
          status: 'ACTIVE',
        }
      })
    }

    // Create house membership
    const houseMembership = await prisma.houseMembership.create({
      data: {
        houseId: house.id,
        membershipId: membership.id,
        role,
        status: 'ACTIVE',
        acceptanceToken: inviteToken,
        acceptanceTokenSentAt: new Date(),
      }
    })

    // Create member profile
    await prisma.memberProfile.upsert({
      where: { houseMembershipId: houseMembership.id },
      update: {},
      create: {
        houseMembershipId: houseMembership.id,
        userId: user.id,
        houseId: house.id,
      }
    })

    // Create member dashboard
    await prisma.memberDashboard.upsert({
      where: { houseMembershipId: houseMembership.id },
      update: {},
      create: {
        houseMembershipId: houseMembership.id,
        userId: user.id,
        houseId: house.id,
      }
    })

    // SEND EMAIL FIRST - Before attempting to create membership item
    if (sendInviteEmail) {
      const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invite?token=${inviteToken}&type=house-staff&houseId=${house.id}`
      
      try {
        await sendEmail({
          to: email,
          template: isStaff ? 'staff-invitation' : 'member-invitation',
          data: {
            name: user.name || email.split('@')[0],
            organizationName: house.organization.name,
            houseName: house.name,
            role: roleLabel,
            setupUrl: inviteUrl,
          }
        })
        console.log(`✅ Invitation email sent to ${email}`)
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError)
        // Don't fail the whole request if email fails
      }
    }

    // Create free membership item for staff/manager if needed
    // This is done AFTER email so email is sent even if this fails
    if (isStaff) {
      try {
        // Find or create a free staff plan
        let staffPlan = await prisma.membershipPlan.findFirst({
          where: {
            OR: [
              { houseId: house.id },
              { organizationId: house.organizationId, houseId: null }
            ],
            name: { contains: 'Staff', mode: 'insensitive' }
          },
          include: {
            prices: true
          }
        })

        if (!staffPlan) {
          // Create a free staff plan
          staffPlan = await prisma.membershipPlan.create({
            data: {
              name: 'Staff & Management',
              description: 'Free membership for house staff and managers',
              type: 'CUSTOM',
              status: 'ACTIVE',
              isPublic: false,
              requiresApproval: false,
              organizationId: house.organizationId,
              houseId: house.id,
              features: ['Full access to member portal', 'Event management', 'Member directory'],
              prices: {
                create: {
                  billingFrequency: 'MONTHLY',
                  amount: 0,
                  currency: 'USD',
                  setupFee: 0,
                }
              }
            },
            include: { 
              prices: true 
            }
          })
        }

        // Ensure staffPlan has prices
        if (!staffPlan.prices || staffPlan.prices.length === 0) {
          const planWithPrices = await prisma.membershipPlan.findUnique({
            where: { id: staffPlan.id },
            include: { prices: true }
          })
          staffPlan = planWithPrices!
        }

        const staffPrice = staffPlan.prices[0]

        if (staffPrice) {
          // Create membership item for tracking
          await prisma.membershipItem.create({
            data: {
              organizationId: house.organizationId,
              houseId: house.id,
              houseMembershipId: houseMembership.id,
              membershipPlanId: staffPlan.id,
              planPriceId: staffPrice.id,
              userId: user.id,
              status: 'ACTIVE',
              billingFrequency: 'MONTHLY',
              amount: 0,
              currency: 'USD',
              startDate: new Date(),
              paymentStatus: 'SUCCEEDED',
            }
          })
          console.log(`✅ Free staff membership created for ${email}`)
        }
      } catch (membershipError) {
        console.error('Failed to create free membership item:', membershipError)
        // Don't fail the whole request - membership can be assigned later
      }
    }

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email || '',
        action: 'MEMBER_INVITED',
        entityType: 'HOUSE_MEMBERSHIP',
        entityId: houseMembership.id,
        organizationId: house.organizationId,
        houseId: house.id,
        metadata: { 
          email, 
          role, 
          freeMembership: isStaff,
          emailSent: sendInviteEmail
        }
      }
    })

    return NextResponse.json({
      success: true,
      houseMembership,
      message: `${roleLabel} invited successfully${sendInviteEmail ? ' - invitation email sent' : ''}`
    }, { status: 201 })
  } catch (error) {
    console.error('Invite member error:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}