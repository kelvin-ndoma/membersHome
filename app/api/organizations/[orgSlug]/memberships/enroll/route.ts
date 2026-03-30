import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { sendWelcomeEmail } from "@/lib/email"

export async function POST(
  req: Request,
  { params }: { params: { orgSlug: string } }
) {
  try {
    const session = await requireAuth()

    const body = await req.json()
    const { title, bio, phone } = body

    const organization = await prisma.organization.findUnique({
      where: { slug: params.orgSlug },
      select: { id: true, name: true },
    })

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    const existingMembership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: session.user.id,
          organizationId: organization.id,
        },
      },
    })

    if (existingMembership) {
      return NextResponse.json(
        { error: "Already a member of this organization" },
        { status: 400 }
      )
    }

    const membership = await prisma.membership.create({
      data: {
        userId: session.user.id,
        organizationId: organization.id,
        organizationRole: "MEMBER",
        status: "ACTIVE",
        title,
        bio,
        phone,
        joinedAt: new Date(),
        acceptedAt: new Date(),
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        organization: {
          select: {
            name: true,
          },
        },
      },
    })

    await sendWelcomeEmail(membership.user.email, membership.user.name || "Member")

    return NextResponse.json(membership, { status: 201 })
  } catch (error) {
    console.error("Error enrolling member:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}