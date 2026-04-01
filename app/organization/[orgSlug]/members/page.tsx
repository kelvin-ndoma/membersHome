import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Input } from "@/components/ui/Input"
import { Search, Users, DollarSign, Calendar, Clock, AlertCircle } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

interface MembersPageProps {
  params: Promise<{ orgSlug: string }>
  searchParams: Promise<{ search?: string; status?: string; page?: string }>
}

export default async function MembersPage({ params, searchParams }: MembersPageProps) {
  const session = await getServerSession(authOptions)
  const { orgSlug } = await params
  const { search = "", status = "all", page = "1" } = await searchParams

  if (!session?.user?.id) {
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
    redirect(`/organization/${orgSlug}/dashboard`)
  }

  const pageNum = parseInt(page)
  const pageSize = 10

  const where: any = {
    organizationId: organization.id,
    status: { not: "CANCELLED" },
  }

  if (status !== "all") {
    where.status = status.toUpperCase()
  }

  if (search) {
    where.user = {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    }
  }

  const [members, total] = await Promise.all([
    prisma.membershipItem.findMany({
      where,
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        membershipPlan: {
          select: {
            id: true,
            name: true,
            amount: true,
            billingFrequency: true,
          },
        },
      },
    }),
    prisma.membershipItem.count({ where }),
  ])

  const totalPages = Math.ceil(total / pageSize)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "PAUSED":
        return <Badge className="bg-orange-100 text-orange-800">Paused</Badge>
      case "CANCELLED":
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>
      case "EXPIRED":
        return <Badge className="bg-gray-100 text-gray-800">Expired</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCEEDED":
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "FAILED":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const formatBillingFrequency = (freq: string) => {
    const map: Record<string, string> = {
      MONTHLY: "Monthly",
      QUARTERLY: "Quarterly",
      SEMI_ANNUAL: "Semi-Annual",
      ANNUAL: "Annual"
    }
    return map[freq] || freq
  }

  // Get counts for stats
  const stats = await prisma.membershipItem.groupBy({
    by: ["status"],
    where: { organizationId: organization.id },
    _count: true,
  })

  const totalActive = stats.find(s => s.status === "ACTIVE")?._count || 0
  const totalPending = stats.find(s => s.status === "PENDING")?._count || 0
  const totalPaused = stats.find(s => s.status === "PAUSED")?._count || 0
  const totalRevenue = await prisma.membershipItem.aggregate({
    where: { organizationId: organization.id, status: "ACTIVE" },
    _sum: { amount: true },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Members</h1>
        <p className="text-muted-foreground">Manage your active members and their billing</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalActive}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Pending/Paused</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{totalPending + totalPaused}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue._sum.amount?.toLocaleString() || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Members</CardTitle>
        </CardHeader>
        <CardContent>
          <form method="GET" className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="search"
                placeholder="Search by name or email..."
                defaultValue={search}
                className="pl-9"
              />
            </div>
            <select
              name="status"
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              defaultValue={status}
            >
              <option value="all">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="PAUSED">Paused</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="EXPIRED">Expired</option>
            </select>
            <Button type="submit">Search</Button>
            {search && (
              <Link href={`/organization/${orgSlug}/members`}>
                <Button variant="ghost">Clear</Button>
              </Link>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Members List</CardTitle>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No members found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3 text-left text-sm font-medium">Member</th>
                    <th className="p-3 text-left text-sm font-medium">Plan</th>
                    <th className="p-3 text-left text-sm font-medium">Billing</th>
                    <th className="p-3 text-left text-sm font-medium">Amount</th>
                    <th className="p-3 text-left text-sm font-medium">Status</th>
                    <th className="p-3 text-left text-sm font-medium">Payment</th>
                    <th className="p-3 text-left text-sm font-medium">Next Billing</th>
                    <th className="p-3 text-left text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id} className="border-t hover:bg-muted/50">
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{member.user.name || "Unnamed"}</p>
                          <p className="text-sm text-muted-foreground">{member.user.email}</p>
                        </div>
                      </td>
                      <td className="p-3">
                        <p className="font-medium">{member.membershipPlan.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatBillingFrequency(member.billingFrequency)}
                        </p>
                      </td>
                      <td className="p-3 text-sm">
                        {formatBillingFrequency(member.billingFrequency)}
                      </td>
                      <td className="p-3">
                        <p className="font-medium">${member.amount}</p>
                        {member.vatRate && member.vatRate > 0 && (
                          <p className="text-xs text-muted-foreground">+{member.vatRate}% VAT</p>
                        )}
                      </td>
                      <td className="p-3">
                        {getStatusBadge(member.status)}
                      </td>
                      <td className="p-3">
                        {getPaymentStatusBadge(member.paymentStatus)}
                        {member.failedPaymentCount > 0 && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
                            <AlertCircle className="h-3 w-3" />
                            {member.failedPaymentCount} failed attempt{member.failedPaymentCount !== 1 ? "s" : ""}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-sm">
                        {member.nextBillingDate 
                          ? format(new Date(member.nextBillingDate), "MMM d, yyyy")
                          : "—"}
                      </td>
                      <td className="p-3">
                        <Link href={`/organization/${orgSlug}/members/${member.id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`?page=${p}&search=${search}&status=${status}`}
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