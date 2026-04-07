// app/api/organizations/[orgSlug]/houses/[houseSlug]/members/[memberId]/message/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireHouseAccess } from "@/lib/auth"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = "connect@theburnsbrothers.com"

export async function POST(
  req: Request,
  { params }: { params: { orgSlug: string; houseSlug: string; memberId: string } }
) {
  try {
    const { houseMembership: currentMember, membership } = await requireHouseAccess(params.orgSlug, params.houseSlug)

    // Only admins and managers can send messages
    if (currentMember.role !== "HOUSE_ADMIN" && currentMember.role !== "HOUSE_MANAGER") {
      return NextResponse.json(
        { error: "Only house admins and managers can send messages" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { subject, message } = body

    if (!subject || !message) {
      return NextResponse.json(
        { error: "Subject and message are required" },
        { status: 400 }
      )
    }

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

    const house = await prisma.house.findUnique({
      where: {
        organizationId_slug: {
          organizationId: organization.id,
          slug: params.houseSlug,
        },
      },
      select: { id: true, name: true },
    })

    if (!house) {
      return NextResponse.json(
        { error: "House not found" },
        { status: 404 }
      )
    }

    const targetMember = await prisma.houseMembership.findUnique({
      where: { id: params.memberId },
      include: {
        membership: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!targetMember || targetMember.houseId !== house.id) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      )
    }

    const user = targetMember.membership.user

    // Send email using Resend directly
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
          <h2 style="color: #333;">${house.name}</h2>
          <p style="color: #666;">Message from House Management</p>
        </div>
        <div style="padding: 20px;">
          <p>Dear ${user.name || user.email},</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p style="white-space: pre-wrap;">${message.replace(/\n/g, '<br/>')}</p>
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            This message was sent from the ${house.name} house management system.
          </p>
        </div>
      </div>
    `

    // Check if we're in development mode
    const isDev = process.env.NODE_ENV === "development"
    const forceSendEmails = process.env.FORCE_SEND_EMAILS === "true"

    if (isDev && !forceSendEmails) {
      console.log("\n" + "=".repeat(60))
      console.log("📧 MESSAGE EMAIL (logged - not sent)")
      console.log("=".repeat(60))
      console.log(`From: ${FROM_EMAIL}`)
      console.log(`To: ${user.email}`)
      console.log(`Subject: [${house.name}] ${subject}`)
      console.log(`Message: ${message}`)
      console.log("=".repeat(60) + "\n")
    } else if (process.env.RESEND_API_KEY) {
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: user.email,
        subject: `[${house.name}] ${subject}`,
        html: emailHtml,
      })

      if (error) {
        console.error("❌ Resend error:", error)
        return NextResponse.json(
          { error: "Failed to send email" },
          { status: 500 }
        )
      }
      console.log(`✅ Email sent to ${user.email}`)
    } else {
      console.log("❌ RESEND_API_KEY not configured. Email not sent.")
    }

    // Log communication
    await prisma.communication.create({
      data: {
        organizationId: organization.id,
        houseId: house.id,
        createdBy: membership.id,
        subject,
        body: message,
        type: "EMAIL",
        recipientType: "CUSTOM_SEGMENT",
        status: "SENT",
        sentAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: "Message sent successfully",
    })
  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}