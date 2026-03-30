import { Suspense } from "react"
import Link from "next/link"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { InvoicesTable } from "@/components/commerce/InvoicesTable"
import { Plus, Search } from "lucide-react"

interface InvoicesPageProps {
  params: Promise<{ orgSlug: string }>
  searchParams: Promise<{ page?: string; status?: string; search?: string }>
}

export default async function InvoicesPage({ params, searchParams }: InvoicesPageProps) {
  const session = await getServerSession(authOptions)
  const { orgSlug } = await params
  const { page = "1", status = "all", search = "" } = await searchParams

  if (!session) {
    redirect("/auth/login")
  }

  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
      organization: { slug: orgSlug },
      status: "ACTIVE",
    },
  })

  if (!membership) {
    redirect("/organization")
  }

  const organization = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: { id: true },
  })

  if (!organization) {
    redirect("/organization")
  }

  const pageNum = parseInt(page)
  const pageSize = 10

  const where: any = {
    organizationId: organization.id,
  }

  if (status !== "all") {
    where.status = status
  }

  if (search) {
    where.OR = [
      { invoiceNumber: { contains: search, mode: "insensitive" } },
      { membership: { user: { name: { contains: search, mode: "insensitive" } } } },
    ]
  }

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        membership: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
      },
    }),
    prisma.invoice.count({ where }),
  ])

  const formattedInvoices = invoices.map((invoice) => ({
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    amount: invoice.amount,
    currency: invoice.currency,
    description: invoice.description,
    dueDate: invoice.dueDate,
    status: invoice.status,
    paidAt: invoice.paidAt,
    createdAt: invoice.createdAt,
    membership: {
      user: {
        name: invoice.membership.user.name || "",
        email: invoice.membership.user.email,
      },
    },
  }))

  const totalPages = Math.ceil(total / pageSize)
  const canManage = membership.organizationRole === "ORG_ADMIN" || membership.organizationRole === "ORG_OWNER"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">Manage all invoices for your organization</p>
        </div>
        {canManage && (
          <Link href={`/organization/${orgSlug}/commerce/invoices/create`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          </Link>
        )}
      </div>

      <div className="flex gap-2">
        <form method="GET" className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="search"
              placeholder="Search by invoice number or customer..."
              defaultValue={search}
              className="pl-9"
            />
          </div>
        </form>
        <select
          name="status"
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          defaultValue={status}
          onChange={(e) => {
            const url = new URL(window.location.href)
            url.searchParams.set("status", e.target.value)
            window.location.href = url.toString()
          }}
        >
          <option value="all">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="SENT">Sent</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="OVERDUE">Overdue</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <InvoicesTable
        invoices={formattedInvoices}
        canManage={canManage}
        onView={(id) => {
          window.location.href = `/organization/${orgSlug}/commerce/invoices/${id}`
        }}
        onDownload={(id) => {
          window.location.href = `/organization/${orgSlug}/commerce/invoices/${id}/pdf`
        }}
        onSend={(id) => {
          fetch(`/api/organizations/${orgSlug}/commerce/invoices/${id}/send`, { method: "POST" })
            .then(() => window.location.reload())
        }}
      />

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`?page=${p}&status=${status}&search=${search}`}
              className={`px-3 py-1 rounded ${
                p === pageNum
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}