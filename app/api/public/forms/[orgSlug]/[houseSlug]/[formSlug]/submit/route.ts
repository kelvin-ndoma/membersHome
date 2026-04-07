// app/api/public/forms/[orgSlug]/[houseSlug]/[formSlug]/submit/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(
  req: Request,
  { params }: { params: { orgSlug: string; houseSlug: string; formSlug: string } }
) {
  try {
    const { orgSlug, houseSlug, formSlug } = params
    const body = await req.json()
    const { data } = body

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

    const form = await prisma.customForm.findFirst({
      where: {
        slug: formSlug,
        houseId: house.id,
        status: "PUBLISHED",
      },
    })

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 })
    }

    // Extract email from form data for quick access
    const applicantEmail = data.email || null
    const applicantName = `${data.firstName || ""} ${data.lastName || ""}`.trim() || null

    const submission = await prisma.formSubmission.create({
      data: {
        formId: form.id,
        data,
        userEmail: applicantEmail,
        submittedAt: new Date(),
        status: "PENDING",
      },
    })

    return NextResponse.json({ success: true, submissionId: submission.id }, { status: 201 })
  } catch (error) {
    console.error("Error submitting form:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}