// app/api/organizations/[orgSlug]/houses/[houseSlug]/forms/[formId]/submissions/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"

export async function GET(
  req: Request,
  { params }: { params: { orgSlug: string; houseSlug: string; formId: string } }
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

    const submissions = await prisma.formSubmission.findMany({
      where: {
        formId: params.formId,
      },
      include: {
        form: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    })

    return NextResponse.json({ submissions })
  } catch (error) {
    console.error("Error fetching form submissions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}