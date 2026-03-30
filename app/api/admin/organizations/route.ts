import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requirePlatformAdmin } from "@/lib/auth"
import { generateInviteToken, hashToken } from "@/lib/utils/tokens"
import { sendInvitationEmail } from "@/lib/email"

export async function GET(req: Request) {
  try {
    await requirePlatformAdmin()

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "10")
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status")
    const plan = searchParams.get("plan")

    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { billingEmail: { contains: search, mode: "insensitive" } },
      ]
    }

    if (status) {
      where.status = status
    }

    if (plan) {
      where.plan = plan
    }

    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              memberships: true,
              houses: true,
              events: true,
            },
          },
          memberships: {
            where: { organizationRole: "ORG_OWNER" },
            take: 1,
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      prisma.organization.count({ where }),
    ])

    const formattedOrganizations = organizations.map((org) => ({
      ...org,
      owner: org.memberships[0]?.user || null,
    }))

    return NextResponse.json({
      organizations: formattedOrganizations,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error: any) {
    console.error("Error fetching organizations:", error)
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: error?.status || 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    await requirePlatformAdmin()

    const body = await req.json()
    console.log("=".repeat(60))
    console.log("📝 Request body:", body)
    console.log("=".repeat(60))

    const {
      name,
      slug,
      description,
      website,
      plan,
      billingEmail,
      ownerType,
      ownerUserId,
      ownerEmail,
      ownerName,
    } = body

    console.log("🔍 Owner Type:", ownerType)
    console.log("🔍 Owner Email:", ownerEmail)
    console.log("🔍 Owner Name:", ownerName)

    let ownerId: string
    let isNewUser = false

    if (ownerType === "existing") {
      console.log("📌 Existing user flow")

      if (!ownerUserId) {
        return NextResponse.json(
          { error: "Owner user ID is required" },
          { status: 400 }
        )
      }

      const owner = await prisma.user.findUnique({
        where: { id: ownerUserId },
      })

      if (!owner) {
        return NextResponse.json(
          { error: "Owner user not found" },
          { status: 404 }
        )
      }

      ownerId = owner.id
      console.log("✅ Found existing user:", owner.email)
    } else {
      console.log("📌 New user flow")

      if (!ownerEmail) {
        return NextResponse.json(
          { error: "Owner email is required" },
          { status: 400 }
        )
      }

      let user = await prisma.user.findUnique({
        where: { email: ownerEmail },
      })

      if (!user) {
        console.log("👤 Creating new user:", ownerEmail)
        user = await prisma.user.create({
          data: {
            email: ownerEmail,
            name: ownerName || ownerEmail.split("@")[0],
            platformRole: "USER",
          },
        })
        isNewUser = true
        console.log("✅ New user created with ID:", user.id)
      } else {
        console.log("👤 User already exists:", ownerEmail)
        isNewUser = true
        console.log("✅ Existing user found with ID:", user.id)
      }

      ownerId = user.id
    }

    console.log("✅ Owner ID:", ownerId)
    console.log("🆕 Is New User:", isNewUser)

    const existingOrg = await prisma.organization.findFirst({
      where: {
        OR: [{ slug }, { name }],
      },
    })

    if (existingOrg) {
      return NextResponse.json(
        { error: "Organization with this name or slug already exists" },
        { status: 400 }
      )
    }

    let inviteToken: string | null = null
    let hashedToken: string | null = null
    let invitedAt: Date | null = null

    if (isNewUser) {
      inviteToken = generateInviteToken()
      hashedToken = hashToken(inviteToken)
      invitedAt = new Date()

      console.log("🔑 Generated invite token:", inviteToken)
      console.log("🔒 Hashed token:", hashedToken)
      console.log("🕒 Invited at:", invitedAt.toISOString())
    }

    const organization = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name,
          slug,
          description: description || null,
          website: website || null,
          plan: plan || "FREE",
          billingEmail: billingEmail || null,
          settings: {},
        },
      })

      console.log("🏢 Organization created:", org.id)
      console.log("📛 Organization name:", org.name)
      console.log("🔗 Organization slug:", org.slug)

     const membership = await tx.membership.create({
  data: {
    userId: ownerId,
    organizationId: org.id,
    organizationRole: "ORG_OWNER",
    status: isNewUser ? "PENDING" : "ACTIVE",
    joinedAt: isNewUser ? undefined : new Date(),
    invitedAt: isNewUser ? new Date() : undefined,
    invitationToken: isNewUser ? hashedToken ?? undefined : undefined,
  },
})
      console.log("👥 Membership created for user:", ownerId)
      console.log("📊 Membership status:", membership.status)
      console.log("🎫 Membership ID:", membership.id)
      console.log("🕒 Membership invitedAt:", membership.invitedAt)
      console.log("🔒 Membership invitationToken:", membership.invitationToken)

      return org
    })

    if (isNewUser && inviteToken && ownerEmail) {
      console.log("\n" + "=".repeat(60))
      console.log("📧 Attempting to send invitation email to:", ownerEmail)
      console.log("📧 Invite token:", inviteToken)
      console.log("=".repeat(60))

      try {
        await sendInvitationEmail(ownerEmail, name, inviteToken)
        console.log("✅ Email sent successfully\n")
      } catch (emailError) {
        console.error("❌ Email sending failed:", emailError)
      }
    } else {
      console.log("ℹ️ No email sent (existing user or no token)")
    }

    const createdOrg = await prisma.organization.findUnique({
      where: { id: organization.id },
      include: {
        memberships: {
          where: { organizationRole: "ORG_OWNER" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    console.log("\n" + "=".repeat(60))
    console.log("🎉 Organization creation complete!")
    console.log("📊 Summary:")
    console.log("   Organization ID:", createdOrg?.id)
    console.log("   Organization Name:", createdOrg?.name)
    console.log("   Owner:", createdOrg?.memberships[0]?.user?.email)
    console.log("   New User:", isNewUser)
    if (inviteToken) {
      console.log(
        "   Invite Link:",
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/invitations/${inviteToken}`
      )
    }
    console.log("=".repeat(60) + "\n")

    return NextResponse.json(
      {
        ...createdOrg,
        owner: createdOrg?.memberships[0]?.user,
        isNewUser,
        inviteToken,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("❌ Error creating organization:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error?.message || String(error),
      },
      { status: error?.status || 500 }
    )
  }
}