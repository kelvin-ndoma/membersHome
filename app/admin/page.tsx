import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Users, Building2, Ticket, DollarSign } from "lucide-react"
import Link from "next/link"

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)
  
  console.log("AdminDashboard - Session:", session?.user?.email)
  
  if (!session || session.user.platformRole !== "PLATFORM_ADMIN") {
    console.log("AdminDashboard - Redirecting, not admin")
    redirect("/")
  }

  const [totalOrganizations, totalUsers, totalTicketsSold, totalRevenue, recentOrganizations] = await Promise.all([
    prisma.organization.count(),
    prisma.user.count(),
    prisma.ticketPurchase.aggregate({
      where: { paymentStatus: "SUCCEEDED" },
      _sum: { quantity: true },
    }),
    prisma.ticketPurchase.aggregate({
      where: { paymentStatus: "SUCCEEDED" },
      _sum: { totalAmount: true },
    }),
    prisma.organization.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { memberships: true, houses: true },
        },
      },
    }),
  ])

  const stats = [
    {
      title: "Total Organizations",
      value: totalOrganizations,
      icon: Building2,
      color: "text-blue-500",
      href: "/admin/organizations"
    },
    {
      title: "Total Users",
      value: totalUsers,
      icon: Users,
      color: "text-green-500",
      href: "/admin/users"
    },
    {
      title: "Tickets Sold",
      value: totalTicketsSold._sum?.quantity || 0,
      icon: Ticket,
      color: "text-purple-500",
      href: "/admin/tickets"
    },
    {
      title: "Total Revenue",
      value: `$${(totalRevenue._sum?.totalAmount || 0).toLocaleString()}`,
      icon: DollarSign,
      color: "text-yellow-500",
      href: "/admin/billing"
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {session.user.name || session.user.email}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Organizations</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrganizations.length === 0 ? (
            <p className="text-center text-muted-foreground">No organizations yet</p>
          ) : (
            <div className="space-y-4">
              {recentOrganizations.map((org) => (
                <div key={org.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div>
                    <p className="font-medium">{org.name}</p>
                    <p className="text-sm text-muted-foreground">{org.slug}</p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {org._count.memberships} members • {org._count.houses} houses
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