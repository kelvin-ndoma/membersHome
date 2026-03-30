import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireOrgAccess } from "@/lib/auth"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(
  req: Request,
  { params }: { params: { orgSlug: string; commId: string } }
) {
  try {
    const { membership } = await requireOrgAccess(params.orgSlug)

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

    const communication = await prisma.communication.findFirst({
      where: {
        id: params.commId,
        organizationId: organization.id,
      },
    })

    if (!communication) {
      return NextResponse.json(
        { error: "Communication not found" },
        { status: 404 }
      )
    }

    if (communication.status === "SENT") {
      return NextResponse.json(
        { error: "Communication already sent" },
        { status: 400 }
      )
    }

    let recipients: any[] = []

    if (communication.recipientType === "ALL_MEMBERS") {
      recipients = await prisma.membership.findMany({
        where: {
          organizationId: organization.id,
          status: "ACTIVE",
        },
        include: {
          user: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      })
    } else if (communication.recipientType === "HOUSE_MEMBERS" && communication.houseId) {
      recipients = await prisma.houseMembership.findMany({
        where: {
          houseId: communication.houseId,
          status: "ACTIVE",
        },
        include: {
          membership: {
            include: {
              user: {
                select: {
                  email: true,
                  name: true,
                },
              },
            },
          },
        },
      })
      recipients = recipients.map(r => ({ user: r.membership.user }))
    }

    let sentCount = 0

    for (const recipient of recipients) {
      if (recipient.user.email && communication.type === "EMAIL") {
        try {
          await resend.emails.send({
            from: `${organization.name} <noreply@membershome.com>`,
            to: recipient.user.email,
            subject: communication.subject,
            html: communication.body,
          })
          sentCount++
        } catch (error) {
          console.error(`Failed to send email to ${recipient.user.email}:`, error)
        }
      }
    }

    const updatedCommunication = await prisma.communication.update({
      where: { id: communication.id },
      data: {
        status: "SENT",
        sentAt: new Date(),
        sentCount,
      },
    })

    return NextResponse.json({
      message: `Communication sent to ${sentCount} recipients`,
      communication: updatedCommunication,
    })
  } catch (error) {
    console.error("Error sending communication:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}