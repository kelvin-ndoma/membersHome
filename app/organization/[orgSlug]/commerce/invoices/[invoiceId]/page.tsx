import { notFound } from "next/navigation"
import Link from "next/link"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Download, Mail, ArrowLeft, Printer } from "lucide-react"
import { format } from "date-fns"

interface InvoicePageProps {
  params: Promise<{ orgSlug: string; invoiceId: string }>
}

export default async function InvoiceDetailPage({ params }: InvoicePageProps) {
  const session = await getServerSession(authOptions)
  const { orgSlug, invoiceId } = await params

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
    select: { id: true, name: true },
  })

  if (!organization) {
    notFound()
  }

  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      organizationId: organization.id,
    },
    include: {
      membership: {
        include: {
          user: {
            select: { name: true, email: true, phone: true },
          },
        },
      },
      creator: {
        select: { name: true, email: true },
      },
    },
  })

  if (!invoice) {
    notFound()
  }

  const canManage = membership.organizationRole === "ORG_ADMIN" || membership.organizationRole === "ORG_OWNER"

  const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-800",
    SENT: "bg-blue-100 text-blue-800",
    PENDING: "bg-yellow-100 text-yellow-800",
    PAID: "bg-green-100 text-green-800",
    OVERDUE: "bg-red-100 text-red-800",
    CANCELLED: "bg-gray-100 text-gray-800",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/organization/${orgSlug}/commerce/invoices`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{invoice.invoiceNumber}</h1>
            <div className="mt-1 flex gap-2">
              <Badge className={statusColors[invoice.status]}>{invoice.status}</Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/organization/${orgSlug}/commerce/invoices/${invoice.id}/pdf`}>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              PDF
            </Button>
          </Link>
          <Button variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          {canManage && invoice.status === "DRAFT" && (
            <Button>
              <Mail className="mr-2 h-4 w-4" />
              Send to Customer
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Invoice Date</p>
                <p className="font-medium">{format(new Date(invoice.createdAt), "MMMM d, yyyy")}</p>
              </div>
              {invoice.dueDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="font-medium">{format(new Date(invoice.dueDate), "MMMM d, yyyy")}</p>
                </div>
              )}
              {invoice.paidAt && (
                <div>
                  <p className="text-sm text-muted-foreground">Paid Date</p>
                  <p className="font-medium">{format(new Date(invoice.paidAt), "MMMM d, yyyy")}</p>
                </div>
              )}
            </div>

            {invoice.description && (
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p>{invoice.description}</p>
              </div>
            )}

            <div>
              <h3 className="mb-3 font-medium">Invoice Items</h3>
              <div className="rounded-md border">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-3 text-left text-sm font-medium">Description</th>
                      <th className="p-3 text-center text-sm font-medium">Quantity</th>
                      <th className="p-3 text-right text-sm font-medium">Unit Price</th>
                      <th className="p-3 text-right text-sm font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(invoice.items as any[]).map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-3">{item.description}</td>
                        <td className="p-3 text-center">{item.quantity}</td>
                        <td className="p-3 text-right">{invoice.currency} {item.unitPrice}</td>
                        <td className="p-3 text-right">{invoice.currency} {item.total}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t bg-muted/50">
                    <tr>
                      <td colSpan={3} className="p-3 text-right font-bold">Total</td>
                      <td className="p-3 text-right font-bold">{invoice.currency} {invoice.amount}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bill To</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{invoice.membership.user.name}</p>
              <p className="text-sm text-muted-foreground">{invoice.membership.user.email}</p>
              {invoice.membership.user.phone && (
                <p className="text-sm text-muted-foreground">{invoice.membership.user.phone}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Organization</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{organization.name}</p>
              <p className="text-sm text-muted-foreground">Created by: {invoice.creator.name || invoice.creator.email}</p>
            </CardContent>
          </Card>

          {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && (
            <Card>
              <CardHeader>
                <CardTitle>Payment</CardTitle>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Pay Now</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}