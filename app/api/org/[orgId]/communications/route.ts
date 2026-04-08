import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/options"
import { prisma } from "@/prisma/client"
import { sendAnnouncementEmail } from "@/lib/email"

export async function GET(
  req: NextRequest,
  { params }: { params: { orgSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orgSlug } = params

    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug }
    })

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    // Verify user is org owner
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

    const communications = await prisma.communication.findMany({
      where: { organizationId: organization.id },
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
  { params }: { params: { orgSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orgSlug } = params
    const { subject, body, type, recipientType, sendToAllMembers } = await req.json()

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

    // Verify user is org owner
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

    // Create communication record
    const communication = await prisma.communication.create({
      data: {
        subject,
        body,
        type: type || "ANNOUNCEMENT",
        recipientType: recipientType || "ALL_MEMBERS",
        organizationId: organization.id,
        createdBy: session.user.id,
        status: "SENT",
        sentAt: new Date(),
      }
    })

    // If sending to all members, send emails
    if (sendToAllMembers) {
      const members = await prisma.membership.findMany({
        where: {
          organizationId: organization.id,
          status: "ACTIVE"
        },
        include: {
          user: true
        }
      })

      for (const member of members) {
        await sendAnnouncementEmail(
          member.user.email,
          member.user.name || "Member",
          organization.name,
          subject,
          body
        )
      }

      await prisma.communication.update({
        where: { id: communication.id },
        data: { sentCount: members.length }
      })
    }

    return NextResponse.json(communication, { status: 201 })
  } catch (error) {
    console.error("Failed to create communication:", error)
    return NextResponse.json(
      { error: "Failed to create communication" },
      { status: 500 }
    )
  }
}