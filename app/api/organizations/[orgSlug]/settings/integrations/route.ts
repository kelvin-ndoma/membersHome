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
        stripeCustomerId: true,
        stripeSubscriptionId: true,
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

    const integrations = {
      stripe: {
        connected: !!organization.stripeCustomerId,
        customerId: organization.stripeCustomerId,
        subscriptionId: organization.stripeSubscriptionId,
      },
      webhooks: settings.webhooks || [],
      apiKeys: settings.apiKeys || [],
      customIntegrations: settings.integrations || {},
    }

    return NextResponse.json(integrations)
  } catch (error) {
    console.error("Error fetching integrations:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(
  req: Request,
  { params }: { params: { orgSlug: string } }
) {
  try {
    const { membership } = await requireOrgAccess(params.orgSlug)

    if (membership.organizationRole !== "ORG_OWNER") {
      return NextResponse.json(
        { error: "Only organization owners can manage integrations" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { type, config } = body

    const organization = await prisma.organization.findUnique({
      where: { slug: params.orgSlug },
      select: { settings: true },
    })

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    const currentSettings = (organization.settings as any) || {}
    let updatedSettings = { ...currentSettings }

    switch (type) {
      case "webhook":
        const webhooks = currentSettings.webhooks || []
        webhooks.push({
          id: Date.now().toString(),
          url: config.url,
          events: config.events,
          createdAt: new Date(),
        })
        updatedSettings.webhooks = webhooks
        break

      case "api_key":
        const apiKeys = currentSettings.apiKeys || []
        const apiKey = `org_${Date.now()}_${Math.random().toString(36).substring(7)}`
        apiKeys.push({
          id: Date.now().toString(),
          name: config.name,
          key: apiKey,
          createdAt: new Date(),
          lastUsed: null,
        })
        updatedSettings.apiKeys = apiKeys
        break

      case "custom":
        const integrations = currentSettings.integrations || {}
        const configName = config.name as string
        integrations[configName] = config
        updatedSettings.integrations = integrations
        break

      default:
        return NextResponse.json(
          { error: "Invalid integration type" },
          { status: 400 }
        )
    }

    await prisma.organization.update({
      where: { slug: params.orgSlug },
      data: { settings: updatedSettings },
    })

    const responseData: any = { success: true }
    if (type === "api_key") {
      const newApiKeys = updatedSettings.apiKeys || []
      responseData.integration = { key: newApiKeys[newApiKeys.length - 1] }
    } else {
      responseData.integration = config
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Error creating integration:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { orgSlug: string } }
) {
  try {
    const { membership } = await requireOrgAccess(params.orgSlug)

    if (membership.organizationRole !== "ORG_OWNER") {
      return NextResponse.json(
        { error: "Only organization owners can manage integrations" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type")
    const id = searchParams.get("id")

    if (!type || !id) {
      return NextResponse.json(
        { error: "Type and id are required" },
        { status: 400 }
      )
    }

    const organization = await prisma.organization.findUnique({
      where: { slug: params.orgSlug },
      select: { settings: true },
    })

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    const currentSettings = (organization.settings as any) || {}
    let updatedSettings = { ...currentSettings }

    switch (type) {
      case "webhook":
        updatedSettings.webhooks = (currentSettings.webhooks || []).filter((w: any) => w.id !== id)
        break

      case "api_key":
        updatedSettings.apiKeys = (currentSettings.apiKeys || []).filter((k: any) => k.id !== id)
        break

      case "custom":
        if (currentSettings.integrations) {
          const integrations = { ...currentSettings.integrations }
          delete integrations[id]
          updatedSettings.integrations = integrations
        }
        break

      default:
        return NextResponse.json(
          { error: "Invalid integration type" },
          { status: 400 }
        )
    }

    await prisma.organization.update({
      where: { slug: params.orgSlug },
      data: { settings: updatedSettings },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting integration:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}