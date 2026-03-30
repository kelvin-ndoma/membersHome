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
      include: {
        _count: {
          select: {
            memberships: true,
            houses: true,
            events: true,
            tickets: true,
          },
        },
      },
    })

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ...organization,
      userRole: membership.organizationRole,
    })
  } catch (error) {
    console.error("Error fetching organization:", error)
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
    const { name, description, logoUrl, website, primaryColor, secondaryColor, settings } = body

    const organization = await prisma.organization.update({
      where: { slug: params.orgSlug },
      data: {
        name,
        description,
        logoUrl,
        website,
        primaryColor,
        secondaryColor,
        settings,
      },
    })

    return NextResponse.json(organization)
  } catch (error) {
    console.error("Error updating organization:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}