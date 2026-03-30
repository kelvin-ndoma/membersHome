import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireOrgAccess } from "@/lib/auth"
import { sendInvoiceEmail } from "@/lib/email"

export async function POST(
  req: Request,
  { params }: { params: { orgSlug: string; invoiceId: string } }
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

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: params.invoiceId,
        organizationId: organization.id,
      },
      include: {
        membership: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      )
    }

    if (invoice.status === "PAID") {
      return NextResponse.json(
        { error: "Cannot send a paid invoice" },
        { status: 400 }
      )
    }

    const invoiceUrl = `${process.env.NEXT_PUBLIC_APP_URL}/organization/${params.orgSlug}/commerce/invoices/${invoice.id}`

    await sendInvoiceEmail(
      invoice.membership.user.email,
      invoice.invoiceNumber,
      invoice.amount,
      invoice.dueDate || new Date(),
      invoiceUrl
    )

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: "SENT" },
    })

    return NextResponse.json(
      { message: "Invoice sent successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error sending invoice:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}