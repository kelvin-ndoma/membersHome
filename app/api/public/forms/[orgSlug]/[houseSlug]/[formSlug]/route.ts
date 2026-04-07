// app/api/public/forms/[orgSlug]/[houseSlug]/[formSlug]/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  req: Request,
  { params }: { params: { orgSlug: string; houseSlug: string; formSlug: string } }
) {
  try {
    const { orgSlug, houseSlug, formSlug } = params

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

    return NextResponse.json({
      id: form.id,
      title: form.title,
      description: form.description,
      fields: form.fields,
    })
  } catch (error) {
    console.error("Error fetching public form:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}