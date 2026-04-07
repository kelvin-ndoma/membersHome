// app/api/public/membership-apply/[orgSlug]/[houseSlug]/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(
  req: Request,
  { params }: { params: { orgSlug: string; houseSlug: string } }
) {
  try {
    const { orgSlug, houseSlug } = params
    const body = await req.json()
    const { firstName, lastName, email, phone, company, position, whyJoin, hearAbout } = body

    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: { id: true },
    })

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    const house = await prisma.house.findFirst({
      where: {
        slug: houseSlug,
        organizationId: organization.id,
      },
    })

    if (!house) {
      return NextResponse.json({ error: "House not found" }, { status: 404 })
    }

    // Get the default membership plan for this house
    const defaultPlan = await prisma.membershipPlan.findFirst({
      where: {
        houseId: house.id,
        status: "ACTIVE",
      },
    })

    if (!defaultPlan) {
      return NextResponse.json({ 
        error: "This house does not have any membership plans configured. Please contact the administrator." 
      }, { status: 400 })
    }

    // Create the membership application
    const application = await prisma.membershipApplication.create({
      data: {
        firstName,
        lastName,
        email,
        phone: phone || null,
        company: company || null,
        position: position || null,
        notes: `${whyJoin || ""}\n\nHow heard: ${hearAbout || "Not specified"}`,
        status: "PENDING",
        organizationId: organization.id,
        membershipPlanId: defaultPlan.id,
      },
    })

    console.log(`✅ Application created: ${application.id} for house: ${house.name}`)

    return NextResponse.json({ success: true, applicationId: application.id }, { status: 201 })
  } catch (error) {
    console.error("Error submitting membership application:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}