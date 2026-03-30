import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Search, Ticket } from "lucide-react"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { redirect } from "next/navigation"

interface SearchParams {
  search?: string
  page?: string
  status?: string
  type?: string
  organizationId?: string
}

export default async function AdminTicketsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.platformRole !== "PLATFORM_ADMIN") {
    redirect("/")
  }

  const params = await searchParams
  const page = parseInt(params.page || "1")
  const pageSize = 10
  const search = params.search || ""
  const status = params.status
  const type = params.type
  const organizationId = params.organizationId

  const where: any = {}
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
    ]
  }
  if (status) {
    where.status = status
  }
  if (type) {
    where.type = type
  }
  if (organizationId) {
    where.organizationId = organizationId
  }

  const [tickets, total, organizations] = await Promise.all([
    prisma.ticket.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        house: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
          },
        },
        _count: {
          select: {
            purchases: true,
            validations: true,
          },
        },
      },
    }),
    prisma.ticket.count({ where }),
    prisma.organization.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    }),
  ])

  const totalPages = Math.ceil(total / pageSize)

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: "bg-gray-100 text-gray-800",
      ACTIVE: "bg-green-100 text-green-800",
      SOLD_OUT: "bg-yellow-100 text-yellow-800",
      CANCELLED: "bg-red-100 text-red-800",
      EXPIRED: "bg-gray-100 text-gray-800",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Platform Tickets</h1>
          <p className="text-muted-foreground">Manage all tickets across the platform</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <form method="GET" className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="search"
                placeholder="Search by name..."
                defaultValue={search}
                className="pl-9"
              />
            </div>
            <select
              name="status"
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              defaultValue={status || ""}
            >
              <option value="">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="SOLD_OUT">Sold Out</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="EXPIRED">Expired</option>
            </select>
            <select
              name="type"
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              defaultValue={type || ""}
            >
              <option value="">All Types</option>
              <option value="GENERAL_ADMISSION">General Admission</option>
              <option value="VIP">VIP</option>
              <option value="EARLY_BIRD">Early Bird</option>
              <option value="GROUP">Group</option>
              <option value="SEASON_PASS">Season Pass</option>
              <option value="WORKSHOP">Workshop</option>
              <option value="COURSE">Course</option>
              <option value="DONATION">Donation</option>
              <option value="CUSTOM">Custom</option>
            </select>
            <select
              name="organizationId"
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              defaultValue={organizationId || ""}
            >
              <option value="">All Organizations</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="p-3 text-left text-sm font-medium">Ticket</th>
                <th className="p-3 text-left text-sm font-medium">Organization</th>
                <th className="p-3 text-left text-sm font-medium">Type</th>
                <th className="p-3 text-left text-sm font-medium">Price</th>
                <th className="p-3 text-left text-sm font-medium">Sales</th>
                <th className="p-3 text-left text-sm font-medium">Status</th>
                <th className="p-3 text-left text-sm font-medium">Created</th>
                <th className="p-3 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="border-t">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Ticket className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{ticket.name}</p>
                        {ticket.event && (
                          <p className="text-xs text-muted-foreground">Event: {ticket.event.title}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <Link href={`/admin/organizations/${ticket.organization.id}`} className="text-primary hover:underline">
                      {ticket.organization.name}
                    </Link>
                    {ticket.house && (
                      <p className="text-xs text-muted-foreground">House: {ticket.house.name}</p>
                    )}
                  </td>
                  <td className="p-3 text-sm">{ticket.type.replace("_", " ")}</td>
                  <td className="p-3 text-sm">
                    {ticket.currency} {ticket.price}
                    {ticket.memberPrice && <span className="text-xs text-muted-foreground"> (Member: {ticket.memberPrice})</span>}
                  </td>
                  <td className="p-3 text-sm">
                    <div>{ticket.soldQuantity} / {ticket.totalQuantity} sold</div>
                    <div className="text-xs text-muted-foreground">{ticket._count.purchases} purchases</div>
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs ${getStatusBadge(ticket.status)}`}>
                      {ticket.status}
                    </span>
                  </td>
                  <td className="p-3 text-sm">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    <Link href={`/admin/tickets/${ticket.id}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`?page=${p}&search=${search}&status=${status || ""}&type=${type || ""}&organizationId=${organizationId || ""}`}
              className={`px-3 py-1 rounded ${
                p === page
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