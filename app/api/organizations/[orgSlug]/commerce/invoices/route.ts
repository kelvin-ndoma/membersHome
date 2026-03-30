import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireOrgAccess } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: { orgSlug: string } }
) {
  try {
    await requireOrgAccess(params.orgSlug)

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "10")
    const status = searchParams.get("status")
    const membershipId = searchParams.get("membershipId")

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

    const where: any = {
      organizationId: organization.id,
    }

    if (status) {
      where.status = status
    }

    if (membershipId) {
      where.membershipId = membershipId
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          membership: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
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
      }),
      prisma.invoice.count({ where }),
    ])

    return NextResponse.json({
      invoices,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error("Error fetching invoices:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(
  req: Request,
  { params }: { params: { orgSlug: string } }
) {
  try {
    const { membership } = await requireOrgAccess(params.orgSlug)

    const body = await req.json()
    const { membershipId, amount, description, dueDate, items, currency } = body

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

    const targetMembership = await prisma.membership.findFirst({
      where: {
        id: membershipId,
        organizationId: organization.id,
      },
    })

    if (!targetMembership) {
      return NextResponse.json(
        { error: "Membership not found" },
        { status: 404 }
      )
    }

    const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        organizationId: organization.id,
        membershipId,
        amount,
        currency: currency || "USD",
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        items,
        status: "DRAFT",
        createdBy: membership.userId,
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

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error("Error creating invoice:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}