// app/api/portal/[houseSlug]/settings/route.ts
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

    const { houseSlug } = await Promise.resolve(params)

    // First, find all houses with this slug (there might be multiple)
    const houses = await prisma.house.findMany({
      where: { slug: houseSlug },
      include: {
        memberPortal: true,
        organization: true
      }
    })

    if (houses.length === 0) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

    // Find the user's membership for ANY of these houses
    let targetHouse = null
    let memberAccess = null
    let isAdmin = false

    for (const house of houses) {
      const membership = await prisma.houseMembership.findFirst({
        where: {
          houseId: house.id,
          membership: { 
            userId: session.user.id,
            status: 'ACTIVE'
          },
          status: 'ACTIVE'
        },
        include: {
          memberDashboard: true,
          memberProfile: true,
          membership: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                  phone: true,
                }
              }
            }
          }
        }
      })
      
      if (membership) {
        targetHouse = house
        memberAccess = membership
        // Check if user has admin role in the house
        isAdmin = membership.role === 'HOUSE_ADMIN' || membership.role === 'HOUSE_MANAGER'
        break
      }
    }

    // If still not found, check if user is org admin
    if (!memberAccess) {
      for (const house of houses) {
        const orgMembership = await prisma.membership.findFirst({
          where: {
            userId: session.user.id,
            organizationId: house.organizationId,
            role: { in: ['ORG_OWNER', 'ORG_ADMIN'] },
            status: 'ACTIVE'
          }
        })
        
        if (orgMembership) {
          targetHouse = house
          isAdmin = true
          
          // Get the user data directly from the database
          const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              phone: true,
            }
          })
          
          return NextResponse.json({
            dashboard: null,
            profile: null,
            portal: house.memberPortal,
            user: user || {
              id: session.user.id,
              name: session.user.name || null,
              email: session.user.email || '',
              image: null,
              phone: null,
            },
            marketplaceSettings: {
              feePercent: house.marketplaceFeePercent || 5,
              autoApproveProducts: house.autoApproveProducts || false
            },
            isAdmin: true
          })
        }
      }
    }

    if (!memberAccess || !targetHouse) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 })
    }

    // Return the data with user information and marketplace settings
    return NextResponse.json({
      dashboard: memberAccess.memberDashboard,
      profile: memberAccess.memberProfile,
      portal: targetHouse.memberPortal,
      user: memberAccess.membership?.user || {
        id: session.user.id,
        name: session.user.name || null,
        email: session.user.email || '',
        image: null,
        phone: null,
      },
      marketplaceSettings: {
        feePercent: targetHouse.marketplaceFeePercent || 5,
        autoApproveProducts: targetHouse.autoApproveProducts || false
      },
      isAdmin: isAdmin
    })
  } catch (error) {
    console.error('Settings error:', error)
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

    const { houseSlug } = await Promise.resolve(params)
    const updates = await req.json()
    const { dashboardUpdates, profileUpdates, marketplaceUpdates } = updates

    // Find all houses with this slug
    const houses = await prisma.house.findMany({
      where: { slug: houseSlug }
    })

    if (houses.length === 0) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

    // Find the user's membership
    let memberAccess = null
    let targetHouse = null
    let isAdmin = false

    for (const house of houses) {
      const membership = await prisma.houseMembership.findFirst({
        where: {
          houseId: house.id,
          membership: { 
            userId: session.user.id,
            status: 'ACTIVE'
          },
          status: 'ACTIVE'
        },
        include: {
          memberDashboard: true,
          memberProfile: true
        }
      })
      
      if (membership) {
        targetHouse = house
        memberAccess = membership
        isAdmin = membership.role === 'HOUSE_ADMIN' || membership.role === 'HOUSE_MANAGER'
        break
      }
    }

    // If not a house member, check if org admin
    if (!memberAccess) {
      for (const house of houses) {
        const orgMembership = await prisma.membership.findFirst({
          where: {
            userId: session.user.id,
            organizationId: house.organizationId,
            role: { in: ['ORG_OWNER', 'ORG_ADMIN'] },
            status: 'ACTIVE'
          }
        })
        
        if (orgMembership) {
          targetHouse = house
          isAdmin = true
          break
        }
      }
    }

    if (!targetHouse) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Update marketplace settings (admin only)
    if (marketplaceUpdates && isAdmin) {
      await prisma.house.update({
        where: { id: targetHouse.id },
        data: {
          marketplaceFeePercent: marketplaceUpdates.feePercent !== undefined 
            ? marketplaceUpdates.feePercent 
            : undefined,
          autoApproveProducts: marketplaceUpdates.autoApproveProducts !== undefined 
            ? marketplaceUpdates.autoApproveProducts 
            : undefined
        }
      })
    } else if (marketplaceUpdates && !isAdmin) {
      return NextResponse.json({ error: 'Admin access required to update marketplace settings' }, { status: 403 })
    }

    // Update dashboard (if member)
    if (dashboardUpdates && memberAccess) {
      await prisma.memberDashboard.upsert({
        where: { houseMembershipId: memberAccess.id },
        update: {
          widgetLayout: dashboardUpdates.widgetLayout,
          pinnedItems: dashboardUpdates.pinnedItems,
          defaultView: dashboardUpdates.defaultView,
          emailDigest: dashboardUpdates.emailDigest,
          digestFrequency: dashboardUpdates.digestFrequency,
        },
        create: {
          houseMembershipId: memberAccess.id,
          userId: session.user.id,
          houseId: targetHouse.id,
          widgetLayout: dashboardUpdates.widgetLayout || {},
          pinnedItems: dashboardUpdates.pinnedItems || [],
          defaultView: dashboardUpdates.defaultView || 'grid',
          emailDigest: dashboardUpdates.emailDigest ?? true,
          digestFrequency: dashboardUpdates.digestFrequency || 'weekly',
        }
      })
    }

    // Update profile settings (if member)
    if (profileUpdates && memberAccess) {
      await prisma.memberProfile.upsert({
        where: { houseMembershipId: memberAccess.id },
        update: {
          phone: profileUpdates.phone,
          language: profileUpdates.language,
          timezone: profileUpdates.timezone,
          notificationPreferences: profileUpdates.notificationPreferences || undefined,
          privacySettings: profileUpdates.privacySettings || undefined,
        },
        create: {
          houseMembershipId: memberAccess.id,
          userId: session.user.id,
          houseId: targetHouse.id,
          phone: profileUpdates.phone,
          language: profileUpdates.language || 'en',
          timezone: profileUpdates.timezone || 'UTC',
          notificationPreferences: profileUpdates.notificationPreferences || {},
          privacySettings: profileUpdates.privacySettings || {},
        }
      })
    }

    // Log activity (if member)
    if (memberAccess) {
      await prisma.memberActivity.create({
        data: {
          houseMembershipId: memberAccess.id,
          dashboardId: memberAccess.memberDashboard?.id || memberAccess.id,
          userId: session.user.id,
          activityType: 'PROFILE_UPDATE',
          entityId: memberAccess.id,
          entityType: 'HOUSE_MEMBERSHIP',
          performedAt: new Date()
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update settings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Add PUT method for marketplace settings (admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: { houseSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { houseSlug } = await Promise.resolve(params)
    const body = await req.json()
    const { marketplaceFeePercent, autoApproveProducts } = body

    // Find all houses with this slug
    const houses = await prisma.house.findMany({
      where: { slug: houseSlug }
    })

    if (houses.length === 0) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

    // Check if user is admin
    let targetHouse = null
    let isAdmin = false

    for (const house of houses) {
      // Check house membership
      const houseMembership = await prisma.houseMembership.findFirst({
        where: {
          houseId: house.id,
          membership: { userId: session.user.id },
          role: { in: ['HOUSE_ADMIN', 'HOUSE_MANAGER'] }
        }
      })
      
      if (houseMembership) {
        targetHouse = house
        isAdmin = true
        break
      }
      
      // Check org membership
      const orgMembership = await prisma.membership.findFirst({
        where: {
          userId: session.user.id,
          organizationId: house.organizationId,
          role: { in: ['ORG_OWNER', 'ORG_ADMIN'] }
        }
      })
      
      if (orgMembership) {
        targetHouse = house
        isAdmin = true
        break
      }
    }

    if (!targetHouse || !isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Update marketplace settings
    const updated = await prisma.house.update({
      where: { id: targetHouse.id },
      data: {
        marketplaceFeePercent: marketplaceFeePercent !== undefined ? marketplaceFeePercent : undefined,
        autoApproveProducts: autoApproveProducts !== undefined ? autoApproveProducts : undefined
      },
      select: {
        id: true,
        name: true,
        slug: true,
        marketplaceFeePercent: true,
        autoApproveProducts: true
      }
    })

    return NextResponse.json({
      success: true,
      house: updated,
      message: 'Marketplace settings updated successfully'
    })
  } catch (error) {
    console.error('Error updating marketplace settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}