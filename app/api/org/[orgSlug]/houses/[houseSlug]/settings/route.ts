// app/api/org/[orgSlug]/houses/[houseSlug]/settings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

// Define proper types
interface ThemeColors {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  textColor: string
  borderRadius: string
  buttonStyle: string
  fontFamily: string
  logoUrl: string
}

interface OrganizationTheme extends Partial<ThemeColors> {
  useCustomBranding?: boolean
}

interface HouseTheme extends Partial<ThemeColors> {
  useCustomBranding?: boolean
}

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
          include: {
            platform: true
          }
        }
      }
    })

    if (!house) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

    // Check if user has access
    const membership = await prisma.houseMembership.findFirst({
      where: {
        houseId: house.id,
        membership: { userId: session.user.id },
        role: { in: ['HOUSE_MANAGER', 'HOUSE_ADMIN'] }
      }
    })

    const orgAdmin = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organizationId: house.organizationId,
        role: { in: ['ORG_OWNER', 'ORG_ADMIN'] }
      }
    })

    if (!membership && !orgAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    // Safely extract theme data
    const houseThemeRaw = house.theme as any || {}
    
    // Platform theme (default values, always strings)
    const platformTheme: ThemeColors = {
      primaryColor: house.organization.platform?.primaryColor || '#3B82F6',
      secondaryColor: house.organization.platform?.secondaryColor || '#1E40AF',
      accentColor: house.organization.platform?.accentColor || '#10B981',
      backgroundColor: house.organization.platform?.backgroundColor || '#F9FAFB',
      textColor: house.organization.platform?.textColor || '#111827',
      borderRadius: house.organization.platform?.borderRadius || '0.5rem',
      buttonStyle: house.organization.platform?.buttonStyle || 'rounded',
      fontFamily: house.organization.platform?.fontFamily || 'Inter',
      logoUrl: house.organization.platform?.logoUrl || '',
    }

    // Organization theme (can be null)
    const orgTheme: OrganizationTheme = {
      primaryColor: house.organization.primaryColor || undefined,
      secondaryColor: house.organization.secondaryColor || undefined,
      accentColor: house.organization.accentColor || undefined,
      backgroundColor: house.organization.backgroundColor || undefined,
      textColor: house.organization.textColor || undefined,
      borderRadius: house.organization.borderRadius || undefined,
      buttonStyle: house.organization.buttonStyle || undefined,
      fontFamily: house.organization.fontFamily || undefined,
      logoUrl: house.organization.logoUrl || undefined,
      useCustomBranding: house.organization.useCustomBranding || false,
    }

    // House theme (can be null)
    const houseTheme: HouseTheme = {
      logoUrl: houseThemeRaw.logoUrl || house.logoUrl || undefined,
      primaryColor: houseThemeRaw.primaryColor || undefined,
      secondaryColor: houseThemeRaw.secondaryColor || undefined,
      accentColor: houseThemeRaw.accentColor || undefined,
      backgroundColor: houseThemeRaw.backgroundColor || undefined,
      textColor: houseThemeRaw.textColor || undefined,
      borderRadius: houseThemeRaw.borderRadius || undefined,
      buttonStyle: houseThemeRaw.buttonStyle || undefined,
      fontFamily: houseThemeRaw.fontFamily || undefined,
      useCustomBranding: houseThemeRaw.useCustomBranding || false,
    }

    // Portal theme
    const portalTheme = house.memberPortal?.theme as any || {}

    // Calculate effective theme (start with platform defaults)
    let effectiveTheme = { ...platformTheme }
    
    // Apply organization overrides
    if (orgTheme.useCustomBranding) {
      if (orgTheme.primaryColor) effectiveTheme.primaryColor = orgTheme.primaryColor
      if (orgTheme.secondaryColor) effectiveTheme.secondaryColor = orgTheme.secondaryColor
      if (orgTheme.accentColor) effectiveTheme.accentColor = orgTheme.accentColor
      if (orgTheme.backgroundColor) effectiveTheme.backgroundColor = orgTheme.backgroundColor
      if (orgTheme.textColor) effectiveTheme.textColor = orgTheme.textColor
      if (orgTheme.borderRadius) effectiveTheme.borderRadius = orgTheme.borderRadius
      if (orgTheme.buttonStyle) effectiveTheme.buttonStyle = orgTheme.buttonStyle
      if (orgTheme.fontFamily) effectiveTheme.fontFamily = orgTheme.fontFamily
      if (orgTheme.logoUrl) effectiveTheme.logoUrl = orgTheme.logoUrl
    }
    
    // Apply house overrides
    if (houseTheme.useCustomBranding) {
      if (houseTheme.primaryColor) effectiveTheme.primaryColor = houseTheme.primaryColor
      if (houseTheme.secondaryColor) effectiveTheme.secondaryColor = houseTheme.secondaryColor
      if (houseTheme.accentColor) effectiveTheme.accentColor = houseTheme.accentColor
      if (houseTheme.backgroundColor) effectiveTheme.backgroundColor = houseTheme.backgroundColor
      if (houseTheme.textColor) effectiveTheme.textColor = houseTheme.textColor
      if (houseTheme.borderRadius) effectiveTheme.borderRadius = houseTheme.borderRadius
      if (houseTheme.buttonStyle) effectiveTheme.buttonStyle = houseTheme.buttonStyle
      if (houseTheme.fontFamily) effectiveTheme.fontFamily = houseTheme.fontFamily
      if (houseTheme.logoUrl) effectiveTheme.logoUrl = houseTheme.logoUrl
    }
    
    // Apply portal overrides
    if (portalTheme.useCustomBranding) {
      if (portalTheme.primaryColor) effectiveTheme.primaryColor = portalTheme.primaryColor
      if (portalTheme.secondaryColor) effectiveTheme.secondaryColor = portalTheme.secondaryColor
      if (portalTheme.accentColor) effectiveTheme.accentColor = portalTheme.accentColor
      if (portalTheme.backgroundColor) effectiveTheme.backgroundColor = portalTheme.backgroundColor
      if (portalTheme.textColor) effectiveTheme.textColor = portalTheme.textColor
      if (portalTheme.borderRadius) effectiveTheme.borderRadius = portalTheme.borderRadius
      if (portalTheme.buttonStyle) effectiveTheme.buttonStyle = portalTheme.buttonStyle
      if (portalTheme.fontFamily) effectiveTheme.fontFamily = portalTheme.fontFamily
      if (portalTheme.logoUrl) effectiveTheme.logoUrl = portalTheme.logoUrl
    }

    return NextResponse.json({ 
      house: {
        id: house.id,
        name: house.name,
        slug: house.slug,
        description: house.description,
        logoUrl: house.logoUrl,
        isPrivate: house.isPrivate,
        theme: house.theme,
        // Marketplace settings at house level
        marketplaceFeePercent: house.marketplaceFeePercent || 5,
        autoApproveProducts: house.autoApproveProducts || false,
      },
      portal: house.memberPortal,
      hierarchy: {
        platform: platformTheme,
        organization: orgTheme,
        house: houseTheme,
        portal: portalTheme,
        effective: effectiveTheme
      }
    })
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

    const body = await req.json()
    const { theme, general, portal, marketplace } = body

    // First find the house
    const house = await prisma.house.findFirst({
      where: {
        slug: params.houseSlug,
        organization: { slug: params.orgSlug }
      }
    })

    if (!house) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

    // Check permissions
    const membership = await prisma.houseMembership.findFirst({
      where: {
        houseId: house.id,
        membership: { userId: session.user.id },
        role: { in: ['HOUSE_MANAGER', 'HOUSE_ADMIN'] }
      }
    })

    const orgAdmin = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organizationId: house.organizationId,
        role: { in: ['ORG_OWNER', 'ORG_ADMIN'] }
      }
    })

    if (!membership && !orgAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    // Update house data
    const houseUpdateData: {
      name?: string
      description?: string | null
      isPrivate?: boolean
      settings?: any
      theme?: any
      logoUrl?: string | null
      marketplaceFeePercent?: number
      autoApproveProducts?: boolean
    } = {}
    
    if (general) {
      if (general.name !== undefined) houseUpdateData.name = general.name
      if (general.description !== undefined) houseUpdateData.description = general.description
      if (general.isPrivate !== undefined) houseUpdateData.isPrivate = general.isPrivate
      if (general.settings) houseUpdateData.settings = general.settings
    }

    // Update marketplace settings
    if (marketplace) {
      if (marketplace.feePercent !== undefined) {
        houseUpdateData.marketplaceFeePercent = marketplace.feePercent
      }
      if (marketplace.autoApproveProducts !== undefined) {
        houseUpdateData.autoApproveProducts = marketplace.autoApproveProducts
      }
    }

    if (theme) {
      // Get current theme
      const currentTheme = (house.theme as any) || {}
      
      // Merge with new theme data
      const updatedTheme = {
        ...currentTheme,
        ...theme,
        useCustomBranding: theme.useCustomBranding !== undefined 
          ? theme.useCustomBranding 
          : currentTheme.useCustomBranding || false
      }
      
      houseUpdateData.theme = updatedTheme
      
      // Also update logoUrl at house level if provided in theme
      if (theme.logoUrl) {
        houseUpdateData.logoUrl = theme.logoUrl
      }
    }

    let updatedHouse = house
    if (Object.keys(houseUpdateData).length > 0) {
      updatedHouse = await prisma.house.update({
        where: { id: house.id },
        data: houseUpdateData
      })
    }

    // Update portal if provided
    let updatedPortal = null
    if (portal) {
      const existingPortal = await prisma.memberPortal.findUnique({
        where: { houseId: house.id }
      })

      const portalData: {
        theme?: any
        layout?: string
        sidebarPosition?: string
        showLogo?: boolean
        navigation?: any
        features?: any
        requireMFAForPortal?: boolean
        sessionTimeout?: number
        welcomeMessage?: string | null
        customCSS?: string | null
        customJS?: string | null
      } = {}
      
      if (portal.theme !== undefined) portalData.theme = portal.theme
      if (portal.layout !== undefined) portalData.layout = portal.layout
      if (portal.sidebarPosition !== undefined) portalData.sidebarPosition = portal.sidebarPosition
      if (portal.showLogo !== undefined) portalData.showLogo = portal.showLogo
      if (portal.navigation !== undefined) portalData.navigation = portal.navigation
      if (portal.features !== undefined) portalData.features = portal.features
      if (portal.requireMFAForPortal !== undefined) portalData.requireMFAForPortal = portal.requireMFAForPortal
      if (portal.sessionTimeout !== undefined) portalData.sessionTimeout = portal.sessionTimeout
      if (portal.welcomeMessage !== undefined) portalData.welcomeMessage = portal.welcomeMessage
      if (portal.customCSS !== undefined) portalData.customCSS = portal.customCSS
      if (portal.customJS !== undefined) portalData.customJS = portal.customJS

      if (existingPortal && Object.keys(portalData).length > 0) {
        updatedPortal = await prisma.memberPortal.update({
          where: { houseId: house.id },
          data: portalData
        })
      } else if (Object.keys(portalData).length > 0) {
        updatedPortal = await prisma.memberPortal.create({
          data: {
            houseId: house.id,
            organizationId: house.organizationId,
            theme: portal.theme || {},
            features: portal.features || {},
            welcomeMessage: portal.welcomeMessage || '',
            layout: portal.layout || 'default',
            sidebarPosition: portal.sidebarPosition || 'left',
            showLogo: portal.showLogo !== undefined ? portal.showLogo : true,
            navigation: portal.navigation || {},
            requireMFAForPortal: portal.requireMFAForPortal || false,
            sessionTimeout: portal.sessionTimeout || 480,
            customCSS: portal.customCSS || '',
            customJS: portal.customJS || '',
          }
        })
      }
    }

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email || '',
        action: 'HOUSE_SETTINGS_UPDATED',
        entityType: 'HOUSE',
        entityId: house.id,
        organizationId: house.organizationId,
        houseId: house.id,
        metadata: { 
          updatedFields: Object.keys(body),
          themeUpdated: !!theme,
          generalUpdated: !!general,
          portalUpdated: !!portal,
          marketplaceUpdated: !!marketplace
        }
      }
    })

    // Return simplified response
    return NextResponse.json({ 
      success: true,
      house: {
        id: updatedHouse.id,
        name: updatedHouse.name,
        slug: updatedHouse.slug,
        theme: updatedHouse.theme,
        marketplaceFeePercent: updatedHouse.marketplaceFeePercent,
        autoApproveProducts: updatedHouse.autoApproveProducts,
      },
      portal: updatedPortal
    })
  } catch (error) {
    console.error('Update house settings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}