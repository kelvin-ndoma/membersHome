import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { DollarSign, TrendingUp, FileText, CreditCard, ArrowRight } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

interface CommercePageProps {
  params: Promise<{ orgSlug: string }>
}

export default async function CommercePage({ params }: CommercePageProps) {
  const session = await getServerSession(authOptions)
  const { orgSlug } = await params

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

  const [totalRevenue, totalInvoices, pendingInvoices, recentInvoices, revenueByMonth] = await Promise.all([
    prisma.payment.aggregate({
      where: {
        organizationId: organization.id,
        status: "SUCCEEDED",
      },
      _sum: { amount: true },
    }),
    prisma.invoice.count({
      where: { organizationId: organization.id },
    }),
    prisma.invoice.count({
      where: {
        organizationId: organization.id,
        status: { in: ["PENDING", "OVERDUE"] },
      },
    }),
    prisma.invoice.findMany({
      where: { organizationId: organization.id },
      take: 5,
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
    prisma.payment.groupBy({
      by: ["createdAt"],
      where: {
        organizationId: organization.id,
        status: "SUCCEEDED",
        createdAt: { gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) },
      },
      _sum: { amount: true },
    }),
  ])

  const stats = [
    {
      title: "Total Revenue",
      value: `$${(totalRevenue._sum?.amount || 0).toLocaleString()}`,
      icon: DollarSign,
      color: "text-green-500",
    },
    {
      title: "Total Invoices",
      value: totalInvoices,
      icon: FileText,
      color: "text-blue-500",
    },
    {
      title: "Pending Payments",
      value: pendingInvoices,
      icon: CreditCard,
      color: "text-yellow-500",
    },
  ]

  const canManage = membership.organizationRole === "ORG_ADMIN" || membership.organizationRole === "ORG_OWNER"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Commerce</h1>
          <p className="text-muted-foreground">Manage invoices, payments, and subscriptions</p>
        </div>
        {canManage && (
          <Link href={`/organization/${orgSlug}/commerce/invoices/create`}>
            <Button>
              <FileText className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          </Link>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Invoices</CardTitle>
            <Link href={`/organization/${orgSlug}/commerce/invoices`}>
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentInvoices.length === 0 ? (
              <p className="text-center text-muted-foreground">No invoices yet</p>
            ) : (
              <div className="space-y-4">
                {recentInvoices.map((invoice) => (
                  <Link key={invoice.id} href={`/organization/${orgSlug}/commerce/invoices/${invoice.id}`}>
                    <div className="flex items-center justify-between border-b pb-3 last:border-0 hover:bg-muted/50 p-2 rounded-lg transition-colors">
                      <div>
                        <p className="font-medium">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {invoice.membership.user.name || invoice.membership.user.email}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${invoice.amount}</p>
                        <p className="text-xs text-muted-foreground">{invoice.status}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {canManage && (
              <Link href={`/organization/${orgSlug}/commerce/invoices/create`}>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Create New Invoice
                </Button>
              </Link>
            )}
            <Link href={`/organization/${orgSlug}/commerce/subscriptions`}>
              <Button variant="outline" className="w-full justify-start">
                <CreditCard className="mr-2 h-4 w-4" />
                Manage Subscriptions
              </Button>
            </Link>
            <Link href={`/organization/${orgSlug}/billing`}>
              <Button variant="outline" className="w-full justify-start">
                <DollarSign className="mr-2 h-4 w-4" />
                Billing Settings
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <p className="text-muted-foreground">Revenue chart will appear here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}