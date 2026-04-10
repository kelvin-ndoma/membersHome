// app/api/org/[orgSlug]/houses/[houseSlug]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const house = await prisma.house.findFirst({
      where: {
        slug: params.houseSlug,
        organization: { slug: params.orgSlug }
      },
      include: {
        organization: {
          select: { id: true, name: true, slug: true }
        },
        _count: {
          select: {
            members: true,
            events: true,
          }
        },
        members: {
          where: {
            membership: { userId: session.user.id }
          },
          select: {
            id: true,
            role: true,
            status: true,
          }
        }
      }
    })

    if (!house) {
      return NextResponse.json(
        { error: 'House not found' },
        { status: 404 }
      )
    }

    const userHouseMembership = house.members[0]
    if (!userHouseMembership || userHouseMembership.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'You are not a member of this house' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      house: {
        ...house,
        userRole: userHouseMembership.role,
      }
    })
  } catch (error) {
    console.error('Get house error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const house = await prisma.house.findFirst({
      where: {
        slug: params.houseSlug,
        organization: { slug: params.orgSlug }
      },
      include: {
        members: {
          where: {
            membership: { userId: session.user.id },
            role: { in: ['HOUSE_MANAGER', 'HOUSE_ADMIN'] }
          }
        }
      }
    })

    if (!house) {
      return NextResponse.json(
        { error: 'House not found' },
        { status: 404 }
      )
    }

    if (house.members.length === 0) {
      return NextResponse.json(
        { error: 'Unauthorized - Manager access required' },
        { status: 403 }
      )
    }

    const updates = await req.json()
    delete updates.slug // Prevent slug changes

    const updatedHouse = await prisma.house.update({
      where: { id: house.id },
      data: updates
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: 'HOUSE_UPDATED',
        entityType: 'HOUSE',
        entityId: house.id,
        organizationId: house.organizationId,
        houseId: house.id,
        metadata: { updates }
      }
    })

    return NextResponse.json({ house: updatedHouse })
  } catch (error) {
    console.error('Update house error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const house = await prisma.house.findFirst({
      where: {
        slug: params.houseSlug,
        organization: { slug: params.orgSlug }
      },
      include: {
        members: {
          where: {
            membership: { userId: session.user.id },
            role: 'HOUSE_MANAGER'
          }
        }
      }
    })

    if (!house) {
      return NextResponse.json(
        { error: 'House not found' },
        { status: 404 }
      )
    }

    // Only org owners or house managers can delete
    const userMembership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organizationId: house.organizationId,
        role: 'ORG_OWNER'
      }
    })

    if (house.members.length === 0 && !userMembership) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Check if it's the last house
    const houseCount = await prisma.house.count({
      where: { organizationId: house.organizationId }
    })

    if (houseCount <= 1) {
      return NextResponse.json(
        { error: 'Cannot delete the last house in the organization' },
        { status: 400 }
      )
    }

    // Delete house and related data
    await prisma.$transaction(async (tx) => {
      await tx.memberPortal.deleteMany({ where: { houseId: house.id } })
      await tx.memberDashboard.deleteMany({ where: { houseId: house.id } })
      await tx.memberProfile.deleteMany({ where: { houseId: house.id } })
      await tx.houseMembership.deleteMany({ where: { houseId: house.id } })
      await tx.house.delete({ where: { id: house.id } })
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: 'HOUSE_DELETED',
        entityType: 'HOUSE',
        entityId: house.id,
        organizationId: house.organizationId,
        metadata: { houseName: house.name }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete house error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}