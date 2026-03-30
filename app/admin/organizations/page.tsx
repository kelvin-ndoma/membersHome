import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Plus, Search } from "lucide-react"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { redirect } from "next/navigation"

interface SearchParams {
  search?: string
  page?: string
  status?: string
}

export default async function OrganizationsPage({
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
  const statusFilter = params.status || "all"

  const where: any = {}
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
    ]
  }
  
  if (statusFilter !== "all") {
    where.status = statusFilter
  }

  const [organizations, total] = await Promise.all([
    prisma.organization.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            memberships: true,
            houses: true,
            events: true,
          },
        },
      },
    }),
    prisma.organization.count({ where }),
  ])

  const totalPages = Math.ceil(total / pageSize)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800"
      case "SUSPENDED":
        return "bg-yellow-100 text-yellow-800"
      case "CANCELLED":
        return "bg-red-100 text-red-800"
      case "TRIAL":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground">Manage all organizations on the platform</p>
        </div>
        <Link href="/admin/organizations/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Organization
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Organizations</CardTitle>
        </CardHeader>
        <CardContent>
          <form method="GET" className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="search"
                placeholder="Search by name or slug..."
                defaultValue={search}
                className="pl-9"
              />
            </div>
            <select
              name="status"
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              defaultValue={statusFilter}
            >
              <option value="all">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="CANCELLED">Deleted</option>
              <option value="TRIAL">Trial</option>
            </select>
            <Button type="submit">Search</Button>
            {statusFilter !== "all" && (
              <Link href="/admin/organizations">
                <Button type="button" variant="ghost">Clear</Button>
              </Link>
            )}
          </form>
        </CardContent>
      </Card>

      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="p-3 text-left text-sm font-medium">Name</th>
                <th className="p-3 text-left text-sm font-medium">Slug</th>
                <th className="p-3 text-left text-sm font-medium">Plan</th>
                <th className="p-3 text-left text-sm font-medium">Members</th>
                <th className="p-3 text-left text-sm font-medium">Houses</th>
                <th className="p-3 text-left text-sm font-medium">Events</th>
                <th className="p-3 text-left text-sm font-medium">Status</th>
                <th className="p-3 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {organizations.map((org) => (
                <tr key={org.id} className="border-t">
                  <td className="p-3 font-medium">{org.name}</td>
                  <td className="p-3 text-sm text-muted-foreground">{org.slug}</td>
                  <td className="p-3 text-sm">{org.plan}</td>
                  <td className="p-3 text-sm">{org._count.memberships}</td>
                  <td className="p-3 text-sm">{org._count.houses}</td>
                  <td className="p-3 text-sm">{org._count.events}</td>
                  <td className="p-3">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs ${getStatusBadge(org.status)}`}>
                      {org.status === "CANCELLED" ? "Deleted" : org.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <Link href={`/admin/organizations/${org.id}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {organizations.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No organizations found</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`?page=${p}&search=${search}&status=${statusFilter}`}
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