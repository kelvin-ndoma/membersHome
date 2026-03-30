import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireOrgAccess } from "@/lib/auth"
import { generateInviteToken, hashToken } from "@/lib/utils/tokens"
import { sendInvitationEmail } from "@/lib/email"

export async function GET(
  req: Request,
  { params }: { params: { orgSlug: string } }
) {
  try {
    await requireOrgAccess(params.orgSlug)

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "10")
    const search = searchParams.get("search") || ""
    const role = searchParams.get("role")
    const status = searchParams.get("status")

    const where: any = {
      organization: { slug: params.orgSlug },
    }

    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }
    }

    if (role) where.organizationRole = role
    if (status) where.status = status

    const [members, total] = await Promise.all([
      prisma.membership.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { joinedAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              phone: true,
            },
          },
          houseMemberships: {
            include: {
              house: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
      }),
      prisma.membership.count({ where }),
    ])

    return NextResponse.json({
      members,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error: any) {
    console.error("Error fetching members:", error)
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: error?.status || 500 }
    )
  }
}

export async function POST(
  req: Request,
  { params }: { params: { orgSlug: string } }
) {
  try {
    const { membership: currentMembership } = await requireOrgAccess(params.orgSlug)

    if (
      currentMembership.organizationRole !== "ORG_OWNER" &&
      currentMembership.organizationRole !== "ORG_ADMIN"
    ) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { email, role = "MEMBER" } = body

    const organization = await prisma.organization.findUnique({
      where: { slug: params.orgSlug },
    })

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    let user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: email.split("@")[0],
        },
      })
    }

    const existingMembership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: organization.id,
        },
      },
    })

    if (existingMembership) {
      return NextResponse.json(
        { error: "User is already a member of this organization" },
        { status: 400 }
      )
    }

    const rawInviteToken = generateInviteToken()
    const hashedInviteToken = hashToken(rawInviteToken)

    const membership = await prisma.membership.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
        organizationRole: role,
        status: "PENDING",
        invitedBy: currentMembership.userId,
        invitedAt: new Date(),
        invitationToken: hashedInviteToken,
      },
    })

    await sendInvitationEmail(email, organization.name, rawInviteToken)

    return NextResponse.json(membership, { status: 201 })
  } catch (error: any) {
    console.error("Error inviting member:", error)
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: error?.status || 500 }
    )
  }
}