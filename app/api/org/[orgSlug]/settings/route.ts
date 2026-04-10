// app/api/org/[orgSlug]/settings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { orgSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organization = await prisma.organization.findUnique({
      where: { slug: params.orgSlug },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        website: true,
        billingEmail: true,
        plan: true,
        status: true,
        primaryColor: true,
        secondaryColor: true,
        customDomain: true,
        settings: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        createdAt: true,
      }
    })

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Check if user is org admin
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organizationId: organization.id,
        role: { in: ['ORG_OWNER', 'ORG_ADMIN'] }
      }
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    return NextResponse.json({ organization })
  } catch (error) {
    console.error('Get settings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { orgSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organization = await prisma.organization.findUnique({
      where: { slug: params.orgSlug }
    })

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organizationId: organization.id,
        role: { in: ['ORG_OWNER', 'ORG_ADMIN'] }
      }
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const updates = await req.json()
    
    // Prevent changing certain fields
    delete updates.id
    delete updates.slug
    delete updates.plan
    delete updates.stripeCustomerId
    delete updates.stripeSubscriptionId
    delete updates.status

    const updatedOrg = await prisma.organization.update({
      where: { id: organization.id },
      data: updates
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: 'ORGANIZATION_SETTINGS_UPDATED',
        entityType: 'ORGANIZATION',
        entityId: organization.id,
        organizationId: organization.id,
        metadata: { updates }
      }
    })

    return NextResponse.json({ organization: updatedOrg })
  } catch (error) {
    console.error('Update settings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}