import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { DollarSign, CreditCard, TrendingUp, Calendar, Download } from "lucide-react"
import { format } from "date-fns"

export default async function AdminBillingPage() {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.platformRole !== "PLATFORM_ADMIN") {
    redirect("/")
  }

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfYear = new Date(now.getFullYear(), 0, 1)

  const [totalRevenue, monthlyRevenue, yearlyRevenue, recentTransactions, planDistribution] = await Promise.all([
    prisma.payment.aggregate({
      where: { status: "SUCCEEDED" },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: {
        status: "SUCCEEDED",
        paidAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: {
        status: "SUCCEEDED",
        paidAt: { gte: startOfYear },
      },
      _sum: { amount: true },
    }),
    prisma.payment.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.organization.groupBy({
      by: ["plan"],
      _count: true,
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
      title: "This Month",
      value: `$${(monthlyRevenue._sum?.amount || 0).toLocaleString()}`,
      icon: TrendingUp,
      color: "text-blue-500",
    },
    {
      title: "This Year",
      value: `$${(yearlyRevenue._sum?.amount || 0).toLocaleString()}`,
      icon: Calendar,
      color: "text-purple-500",
    },
    {
      title: "Active Organizations",
      value: planDistribution.reduce((sum, stat) => sum + stat._count, 0),
      icon: CreditCard,
      color: "text-yellow-500",
    },
  ]

  const planColors: Record<string, string> = {
    FREE: "bg-gray-100 text-gray-800",
    STARTER: "bg-blue-100 text-blue-800",
    PROFESSIONAL: "bg-purple-100 text-purple-800",
    ENTERPRISE: "bg-yellow-100 text-yellow-800",
  }

  const monthlyPrices: Record<string, number> = {
    FREE: 0,
    STARTER: 29,
    PROFESSIONAL: 99,
    ENTERPRISE: 299,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Billing & Revenue</h1>
          <p className="text-muted-foreground">Monitor platform revenue and subscription metrics</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
          <CardHeader>
            <CardTitle>Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {planDistribution.map((plan) => (
                <div key={plan.plan}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{plan.plan}</span>
                    <span>{plan._count} organizations</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full"
                      style={{ 
                        width: `${(plan._count / planDistribution.reduce((sum, p) => sum + p._count, 0)) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div>
                    <p className="font-medium">{transaction.organization?.name || "Unknown"}</p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.user?.name || transaction.user?.email || "System"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(transaction.createdAt), "MMM d, yyyy h:mm a")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">
                      {transaction.currency} {transaction.amount}
                    </p>
                    <p className="text-xs text-muted-foreground">{transaction.status}</p>
                  </div>
                </div>
              ))}
              {recentTransactions.length === 0 && (
                <p className="text-center text-muted-foreground">No transactions yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subscription Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="p-3 text-left text-sm font-medium">Plan</th>
                  <th className="p-3 text-left text-sm font-medium">Organizations</th>
                  <th className="p-3 text-left text-sm font-medium">Monthly Revenue</th>
                  <th className="p-3 text-left text-sm font-medium">Annual Revenue</th>
                  <th className="p-3 text-left text-sm font-medium">Actions</th>
                 </tr>
              </thead>
              <tbody>
                {planDistribution.map((plan) => {
                  const monthlyPrice = monthlyPrices[plan.plan] || 0
                  const yearlyPrice = monthlyPrice * 12 * 0.9
                  
                  return (
                    <tr key={plan.plan} className="border-t">
                      <td className="p-3">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs ${planColors[plan.plan] || "bg-gray-100 text-gray-800"}`}>
                          {plan.plan}
                        </span>
                      </td>
                      <td className="p-3">{plan._count}</td>
                      <td className="p-3">${(plan._count * monthlyPrice).toLocaleString()}</td>
                      <td className="p-3">${Math.round(plan._count * yearlyPrice).toLocaleString()}</td>
                      <td className="p-3">
                        <Button variant="ghost" size="sm">
                          View Details
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}