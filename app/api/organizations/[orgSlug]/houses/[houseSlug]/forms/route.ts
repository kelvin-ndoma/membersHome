// app/api/organizations/[orgSlug]/houses/[houseSlug]/forms/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"
import { slugify } from "@/lib/utils"

// GET - Fetch all forms for a house
export async function GET(
  req: Request,
  { params }: { params: { orgSlug: string; houseSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const organization = await prisma.organization.findUnique({
      where: { slug: params.orgSlug },
      select: { id: true },
    })

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    const house = await prisma.house.findFirst({
      where: {
        slug: params.houseSlug,
        organizationId: organization.id,
      },
    })

    if (!house) {
      return NextResponse.json({ error: "House not found" }, { status: 404 })
    }

    const forms = await prisma.customForm.findMany({
      where: {
        houseId: house.id,
        organizationId: organization.id,
      },
      include: {
        _count: {
          select: { submissions: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ forms })
  } catch (error) {
    console.error("Error fetching forms:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create a new form
export async function POST(
  req: Request,
  { params }: { params: { orgSlug: string; houseSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { title, description, fields, status, houseId } = body

    // Verify the house belongs to the organization
    const organization = await prisma.organization.findUnique({
      where: { slug: params.orgSlug },
      select: { id: true },
    })

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    const house = await prisma.house.findFirst({
      where: {
        id: houseId,
        organizationId: organization.id,
      },
    })

    if (!house) {
      return NextResponse.json({ error: "House not found" }, { status: 404 })
    }

    // Generate a unique slug from title
    let slug = slugify(title)
    const existingForm = await prisma.customForm.findUnique({
      where: { slug },
    })
    if (existingForm) {
      slug = `${slug}-${Date.now()}`
    }

    const form = await prisma.customForm.create({
      data: {
        title,
        description,
        slug,
        fields: fields || [],
        status: status || "DRAFT",
        organizationId: organization.id,
        houseId: house.id,
      },
    })

    return NextResponse.json(form, { status: 201 })
  } catch (error) {
    console.error("Error creating form:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}