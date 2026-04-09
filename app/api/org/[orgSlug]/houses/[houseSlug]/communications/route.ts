import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/options"
import { prisma } from "@/prisma/client"
import { sendAnnouncementEmail } from "@/lib/email"

export async function GET(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orgSlug, houseSlug } = params

    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug }
    })

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organizationId: organization.id,
        organizationRole: "ORG_OWNER",
        status: "ACTIVE"
      }
    })

    if (!membership) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const house = await prisma.house.findFirst({
      where: {
        slug: houseSlug,
        organizationId: organization.id
      }
    })

    if (!house) {
      return NextResponse.json({ error: "House not found" }, { status: 404 })
    }

    const communications = await prisma.communication.findMany({
      where: { 
        organizationId: organization.id,
        houseId: house.id
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(communications)
  } catch (error) {
    console.error("Failed to fetch communications:", error)
    return NextResponse.json(
      { error: "Failed to fetch communications" },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { orgSlug: string; houseSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orgSlug, houseSlug } = params
    const { subject, body } = await req.json()

    if (!subject || !body) {
      return NextResponse.json(
        { error: "Subject and body are required" },
        { status: 400 }
      )
    }

    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug }
    })

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organizationId: organization.id,
        organizationRole: "ORG_OWNER",
        status: "ACTIVE"
      }
    })

    if (!membership) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const house = await prisma.house.findFirst({
      where: {
        slug: houseSlug,
        organizationId: organization.id
      }
    })

    if (!house) {
      return NextResponse.json({ error: "House not found" }, { status: 404 })
    }

    // Get all house members
    const houseMembers = await prisma.houseMembership.findMany({
      where: { 
        houseId: house.id,
        status: "ACTIVE"
      },
      include: {
        membership: {
          include: {
            user: true
          }
        }
      }
    })

    // Send emails to all members
    let sentCount = 0
    for (const hm of houseMembers) {
      await sendAnnouncementEmail(
        hm.membership.user.email,
        hm.membership.user.name || "Member",
        organization.name,
        subject,
        body
      )
      sentCount++
    }

    // Create communication record
    const communication = await prisma.communication.create({
      data: {
        subject,
        body,
        type: "ANNOUNCEMENT",
        recipientType: "HOUSE_MEMBERS",
        organizationId: organization.id,
        houseId: house.id,
        createdBy: session.user.id,
        status: "SENT",
        sentAt: new Date(),
        sentCount,
      }
    })

    return NextResponse.json(communication, { status: 201 })
  } catch (error) {
    console.error("Failed to send announcement:", error)
    return NextResponse.json(
      { error: "Failed to send announcement" },
      { status: 500 }
    )
  }
}