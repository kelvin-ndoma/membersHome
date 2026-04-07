// app/api/organizations/[orgSlug]/houses/[houseSlug]/forms/[formId]/submissions/[submissionId]/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"

export async function GET(
  req: Request,
  { params }: { params: { orgSlug: string; houseSlug: string; formId: string; submissionId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const submission = await prisma.formSubmission.findUnique({
      where: { id: params.submissionId },
    })

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    return NextResponse.json(submission)
  } catch (error) {
    console.error("Error fetching submission:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { orgSlug: string; houseSlug: string; formId: string; submissionId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { status } = body

    const submission = await prisma.formSubmission.update({
      where: { id: params.submissionId },
      data: {
        status,
        reviewedAt: new Date(),
        reviewedBy: session.user.id,
      },
    })

    return NextResponse.json(submission)
  } catch (error) {
    console.error("Error updating submission:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}