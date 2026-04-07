// app/api/organizations/[orgSlug]/houses/[houseSlug]/forms/[formId]/publish/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"

export async function POST(
  req: Request,
  { params }: { params: { orgSlug: string; houseSlug: string; formId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const updatedForm = await prisma.customForm.update({
      where: { id: params.formId },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    })

    return NextResponse.json(updatedForm)
  } catch (error) {
    console.error("Error publishing form:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}