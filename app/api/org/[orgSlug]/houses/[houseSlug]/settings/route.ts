// app/api/org/[orgSlug]/houses/[houseSlug]/settings/route.ts
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
        memberPortal: true,
        organization: {
          select: { name: true, slug: true }
        }
      }
    })

    if (!house) {
      return NextResponse.json(
        { error: 'House not found' },
        { status: 404 }
      )
    }

    // Check if user has access
    const membership = await prisma.houseMembership.findFirst({
      where: {
        houseId: house.id,
        membership: { userId: session.user.id },
        role: { in: ['HOUSE_MANAGER', 'HOUSE_ADMIN'] }
      }
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    return NextResponse.json({ house })
  } catch (error) {
    console.error('Get house settings error:', error)
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
      }
    })

    if (!house) {
      return NextResponse.json(
        { error: 'House not found' },
        { status: 404 }
      )
    }

    const membership = await prisma.houseMembership.findFirst({
      where: {
        houseId: house.id,
        membership: { userId: session.user.id },
        role: { in: ['HOUSE_MANAGER', 'HOUSE_ADMIN'] }
      }
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const { houseUpdates, portalUpdates } = await req.json()

    const updates: any = {}
    if (houseUpdates) {
      updates.name = houseUpdates.name
      updates.description = houseUpdates.description
      updates.logoUrl = houseUpdates.logoUrl
      updates.isPrivate = houseUpdates.isPrivate
      updates.settings = houseUpdates.settings
    }

    const updatedHouse = await prisma.house.update({
      where: { id: house.id },
      data: updates
    })

    if (portalUpdates) {
      await prisma.memberPortal.upsert({
        where: { houseId: house.id },
        update: {
          theme: portalUpdates.theme,
          navigation: portalUpdates.navigation,
          features: portalUpdates.features,
          welcomeMessage: portalUpdates.welcomeMessage,
          customCSS: portalUpdates.customCSS,
          requireMFAForPortal: portalUpdates.requireMFAForPortal,
          sessionTimeout: portalUpdates.sessionTimeout,
        },
        create: {
          houseId: house.id,
          organizationId: house.organizationId,
          theme: portalUpdates.theme || {},
          features: portalUpdates.features || {},
          welcomeMessage: portalUpdates.welcomeMessage,
        }
      })
    }

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: 'HOUSE_SETTINGS_UPDATED',
        entityType: 'HOUSE',
        entityId: house.id,
        organizationId: house.organizationId,
        houseId: house.id,
        metadata: { updates }
      }
    })

    return NextResponse.json({ house: updatedHouse })
  } catch (error) {
    console.error('Update house settings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}