import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireOrgAccess } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: { orgSlug: string } }
) {
  try {
    const { membership } = await requireOrgAccess(params.orgSlug)

    const organization = await prisma.organization.findUnique({
      where: { slug: params.orgSlug },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        primaryColor: true,
        secondaryColor: true,
        settings: true,
      },
    })

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    const settings = organization.settings as any || {}
    const theme = settings.theme || {}

    const branding = {
      name: organization.name,
      logoUrl: organization.logoUrl,
      primaryColor: organization.primaryColor || "#3B82F6",
      secondaryColor: organization.secondaryColor || "#1E40AF",
      settings: theme,
    }

    return NextResponse.json(branding)
  } catch (error) {
    console.error("Error fetching branding settings:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { orgSlug: string } }
) {
  try {
    const { membership } = await requireOrgAccess(params.orgSlug)

    if (membership.organizationRole !== "ORG_OWNER" && membership.organizationRole !== "ORG_ADMIN") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { logoUrl, primaryColor, secondaryColor, settings } = body

    const currentOrg = await prisma.organization.findUnique({
      where: { slug: params.orgSlug },
      select: { settings: true },
    })

    const currentSettings = (currentOrg?.settings as any) || {}
    const updatedSettings = {
      ...currentSettings,
      theme: settings || currentSettings.theme,
    }

    const organization = await prisma.organization.update({
      where: { slug: params.orgSlug },
      data: {
        logoUrl,
        primaryColor,
        secondaryColor,
        settings: updatedSettings,
      },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        primaryColor: true,
        secondaryColor: true,
        settings: true,
      },
    })

    const updatedTheme = (organization.settings as any)?.theme || {}

    return NextResponse.json({
      name: organization.name,
      logoUrl: organization.logoUrl,
      primaryColor: organization.primaryColor,
      secondaryColor: organization.secondaryColor,
      settings: updatedTheme,
    })
  } catch (error) {
    console.error("Error updating branding settings:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}