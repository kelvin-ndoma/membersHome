// app/portal/[orgSlug]/billing/page.tsx
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { CreditCard, DollarSign, Calendar, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

interface BillingPageProps {
  params: Promise<{ orgSlug: string }>
}

export default async function BillingPage({ params }: BillingPageProps) {
  const session = await getServerSession(authOptions)
  const { orgSlug } = await params

  if (!session?.user?.id) {
    redirect(`/auth/login?callbackUrl=/portal/${orgSlug}/billing`)
  }

  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
      organization: { slug: orgSlug },
      status: "ACTIVE",
    },
    include: {
      organization: true,
    },
  })

  if (!membership) {
    redirect(`/organization/${orgSlug}`)
  }

  const membershipItem = await prisma.membershipItem.findFirst({
    where: {
      userId: session.user.id,
      organizationId: membership.organizationId,
      status: "ACTIVE",
    },
    include: {
      membershipPlan: true,
    },
  })

  const invoices = await prisma.invoice.findMany({
    where: {
      membershipId: membership.id,
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  })

  const formatBillingFrequency = (freq: string) => {
    const map: Record<string, string> = {
      MONTHLY: "Monthly",
      QUARTERLY: "Quarterly",
      SEMI_ANNUAL: "Semi-Annual",
      ANNUAL: "Annual"
    }
    return map[freq] || freq
  }

  const getInvoiceStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "OVERDUE":
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>
      case "CANCELLED":
        return <Badge className="bg-gray-100 text-gray-800">Cancelled</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">Manage your subscription and payment history</p>
      </div>

      {/* Current Membership */}
      {membershipItem && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Current Membership
            </CardTitle>
            <CardDescription>Your active subscription details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Plan</p>
                <p className="font-medium">{membershipItem.membershipPlan.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Billing</p>
                <p className="font-medium">
                  ${membershipItem.amount} / {formatBillingFrequency(membershipItem.billingFrequency)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Started</p>
                <p className="font-medium">{format(new Date(membershipItem.startDate), "MMM d, yyyy")}</p>
              </div>
              {membershipItem.nextBillingDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Next Billing</p>
                  <p className="font-medium">{format(new Date(membershipItem.nextBillingDate), "MMM d, yyyy")}</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t">
              <Button variant="destructive" className="w-full sm:w-auto">
                Cancel Subscription
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Your membership will remain active until the end of your billing period
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payment History
          </CardTitle>
          <CardDescription>Recent invoices and payments</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">No invoices yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div>
                    <p className="font-medium">Invoice #{invoice.invoiceNumber}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(invoice.createdAt), "MMM d, yyyy")}</span>
                    </div>
                    {invoice.description && (
                      <p className="text-sm text-muted-foreground">{invoice.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {invoice.currency} {invoice.amount}
                    </p>
                    {getInvoiceStatusBadge(invoice.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}