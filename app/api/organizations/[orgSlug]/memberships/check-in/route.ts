import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireOrgAccess } from "@/lib/auth"
import { generateCheckInQRData } from "@/lib/utils/qrcode"

export async function POST(
  req: Request,
  { params }: { params: { orgSlug: string } }
) {
  try {
    const { membership: staffMembership } = await requireOrgAccess(params.orgSlug)

    const body = await req.json()
    const { qrData, eventId } = body

    let checkInData: any
    try {
      checkInData = JSON.parse(qrData)
    } catch {
      return NextResponse.json(
        { error: "Invalid QR code data" },
        { status: 400 }
      )
    }

    if (checkInData.type !== "checkin") {
      return NextResponse.json(
        { error: "Invalid check-in code" },
        { status: 400 }
      )
    }

    const membership = await prisma.membership.findFirst({
      where: {
        id: checkInData.membershipId,
        organization: { slug: params.orgSlug },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      )
    }

    if (membership.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Membership is not active" },
        { status: 400 }
      )
    }

    if (eventId) {
      const rsvp = await prisma.rSVP.findFirst({
        where: {
          eventId,
          membershipId: membership.id,
        },
      })

      if (!rsvp) {
        return NextResponse.json(
          { error: "Member is not registered for this event" },
          { status: 400 }
        )
      }

      if (rsvp.checkedInAt) {
        return NextResponse.json(
          { error: "Member already checked in for this event" },
          { status: 400 }
        )
      }

      await prisma.rSVP.update({
        where: { id: rsvp.id },
        data: {
          checkedInAt: new Date(),
          checkedInBy: staffMembership.userId,
          status: "ATTENDED",
        },
      })
    }

    await prisma.membership.update({
      where: { id: membership.id },
      data: { lastActiveAt: new Date() },
    })

    return NextResponse.json({
      success: true,
      member: {
        name: membership.user.name,
        email: membership.user.email,
      },
      checkedInAt: new Date(),
    })
  } catch (error) {
    console.error("Error checking in member:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(
  req: Request,
  { params }: { params: { orgSlug: string } }
) {
  try {
    const session = await requireOrgAccess(params.orgSlug)

    const { searchParams } = new URL(req.url)
    const membershipId = searchParams.get("membershipId")
    const eventId = searchParams.get("eventId")

    if (!membershipId) {
      return NextResponse.json(
        { error: "Membership ID required" },
        { status: 400 }
      )
    }

    const membership = await prisma.membership.findFirst({
      where: {
        id: membershipId,
        organization: { slug: params.orgSlug },
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      )
    }

    const qrData = generateCheckInQRData(membership.id, eventId || "")
    const qrCodeDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`

    return NextResponse.json({
      qrCode: qrCodeDataUrl,
      qrData,
    })
  } catch (error) {
    console.error("Error generating check-in QR code:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}