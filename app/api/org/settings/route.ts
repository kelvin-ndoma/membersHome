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
        website: true,
        billingEmail: true,
        plan: true,
        status: true,
        createdAt: true,
        
        // Branding fields
        logoUrl: true,
        faviconUrl: true,
        loginPageImage: true,
        primaryColor: true,
        secondaryColor: true,
        accentColor: true,
        backgroundColor: true,
        textColor: true,
        borderRadius: true,
        buttonStyle: true,
        fontFamily: true,
        customCSS: true,
        customDomain: true,
        useCustomBranding: true,
        
        // Platform defaults (for fallback)
        platform: {
          select: {
            primaryColor: true,
            secondaryColor: true,
            accentColor: true,
            backgroundColor: true,
            textColor: true,
            borderRadius: true,
            buttonStyle: true,
            fontFamily: true,
            logoUrl: true,
            faviconUrl: true,
            loginPageImage: true,
            allowOrgCustomization: true,
          }
        }
      }
    })

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Check if user has admin access
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organizationId: organization.id,
        role: { in: ['ORG_OWNER', 'ORG_ADMIN'] }
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    return NextResponse.json({ organization })
  } catch (error) {
    console.error('Get organization settings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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

    const updates = await req.json()

    const organization = await prisma.organization.findUnique({
      where: { slug: params.orgSlug },
      include: { platform: true }
    })

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Check if user has admin access
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organizationId: organization.id,
        role: { in: ['ORG_OWNER', 'ORG_ADMIN'] }
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    // Check if platform allows org customization
    if (updates.useCustomBranding && !organization.platform?.allowOrgCustomization) {
      return NextResponse.json({ 
        error: 'Custom branding is not allowed by the platform' 
      }, { status: 403 })
    }

    // Remove fields that shouldn't be updated directly
    delete updates.id
    delete updates.slug
    delete updates.plan
    delete updates.status
    delete updates.platform

    const updatedOrg = await prisma.organization.update({
      where: { id: organization.id },
      data: updates
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email || '',
        action: 'ORGANIZATION_SETTINGS_UPDATED',
        entityType: 'ORGANIZATION',
        entityId: organization.id,
        organizationId: organization.id,
        metadata: { 
          updatedFields: Object.keys(updates),
          useCustomBranding: updates.useCustomBranding 
        }
      }
    })

    return NextResponse.json({ organization: updatedOrg })
  } catch (error) {
    console.error('Update organization settings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}