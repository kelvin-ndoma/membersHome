import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireOrgAccess } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: { orgSlug: string; invoiceId: string } }
) {
  try {
    await requireOrgAccess(params.orgSlug)

    const organization = await prisma.organization.findUnique({
      where: { slug: params.orgSlug },
      select: { id: true },
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
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        payer: {
          select: {
            id: true,
            name: true,
            email: true,
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

    return NextResponse.json(invoice)
  } catch (error) {
    console.error("Error fetching invoice:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { orgSlug: string; invoiceId: string } }
) {
  try {
    const { membership } = await requireOrgAccess(params.orgSlug)

    const body = await req.json()
    const { amount, description, dueDate, items, status } = body

    const organization = await prisma.organization.findUnique({
      where: { slug: params.orgSlug },
      select: { id: true },
    })

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    const invoice = await prisma.invoice.update({
      where: {
        id: params.invoiceId,
        organizationId: organization.id,
      },
      data: {
        amount,
        description,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        items,
        status,
      },
    })

    return NextResponse.json(invoice)
  } catch (error) {
    console.error("Error updating invoice:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { orgSlug: string; invoiceId: string } }
) {
  try {
    const { membership } = await requireOrgAccess(params.orgSlug)

    const organization = await prisma.organization.findUnique({
      where: { slug: params.orgSlug },
      select: { id: true },
    })

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    await prisma.invoice.update({
      where: {
        id: params.invoiceId,
        organizationId: organization.id,
      },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    })

    return NextResponse.json(
      { message: "Invoice cancelled successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error cancelling invoice:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}