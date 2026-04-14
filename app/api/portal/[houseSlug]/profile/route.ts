// app/api/portal/[houseSlug]/profile/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { houseSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const house = await prisma.house.findFirst({
      where: { slug: params.houseSlug },
      include: {
        members: {
          where: {
            membership: { userId: session.user.id },
            status: 'ACTIVE'
          },
          include: {
            memberProfile: true,
            membership: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, image: true, phone: true }
                }
              }
            }
          }
        }
      }
    })

    if (!house) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

    const memberAccess = house.members[0]
    if (!memberAccess) {
      return NextResponse.json({ error: 'Not a member of this house' }, { status: 403 })
    }

    return NextResponse.json({
      profile: memberAccess.memberProfile,
      membership: {
        id: memberAccess.id,
        role: memberAccess.role,
        status: memberAccess.status,
        membershipNumber: memberAccess.membershipNumber,
        joinedAt: memberAccess.joinedAt
      },
      user: memberAccess.membership.user
    })
  } catch (error) {
    console.error('Profile error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { houseSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updates = await req.json()
    const { userUpdates, profileUpdates } = updates

    const house = await prisma.house.findFirst({
      where: { slug: params.houseSlug },
      include: {
        members: {
          where: {
            membership: { userId: session.user.id },
            status: 'ACTIVE'
          }
        }
      }
    })

    if (!house) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

    const memberAccess = house.members[0]
    if (!memberAccess) {
      return NextResponse.json({ error: 'Not a member of this house' }, { status: 403 })
    }

    if (userUpdates) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          name: userUpdates.name,
          phone: userUpdates.phone,
          image: userUpdates.image,
        }
      })
    }

    if (profileUpdates) {
      await prisma.memberProfile.upsert({
        where: { houseMembershipId: memberAccess.id },
        update: {
          bio: profileUpdates.bio,
          phone: profileUpdates.phone,
          address: profileUpdates.address,
          emergencyContact: profileUpdates.emergencyContact,
          jobTitle: profileUpdates.jobTitle,
          company: profileUpdates.company,
          industry: profileUpdates.industry,
          skills: profileUpdates.skills || [],
          interests: profileUpdates.interests || [],
          socialLinks: profileUpdates.socialLinks || {},
          notificationPreferences: profileUpdates.notificationPreferences || {},
          privacySettings: profileUpdates.privacySettings || {},
        },
        create: {
          houseMembershipId: memberAccess.id,
          userId: session.user.id,
          houseId: house.id,
          bio: profileUpdates.bio,
          phone: profileUpdates.phone,
          address: profileUpdates.address,
          emergencyContact: profileUpdates.emergencyContact,
          jobTitle: profileUpdates.jobTitle,
          company: profileUpdates.company,
          industry: profileUpdates.industry,
          skills: profileUpdates.skills || [],
          interests: profileUpdates.interests || [],
          socialLinks: profileUpdates.socialLinks || {},
          notificationPreferences: profileUpdates.notificationPreferences || {},
          privacySettings: profileUpdates.privacySettings || {},
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}