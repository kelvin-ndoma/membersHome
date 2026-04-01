import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Search, Home } from "lucide-react"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { redirect } from "next/navigation"

interface SearchParams {
  search?: string
  page?: string
  organizationId?: string
}

export default async function AdminHousesPage({
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
  const organizationId = params.organizationId

  const where: any = {}

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
    ]
  }

  if (organizationId) {
    where.organizationId = organizationId
  }

  const [houses, total, organizations] = await Promise.all([
    prisma.house.findMany({
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
        _count: {
          select: {
            members: true,
            events: true,
            tickets: true,
          },
        },
      },
    }),
    prisma.house.count({ where }),
    prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: { name: "asc" },
    }),
  ])

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Houses</h1>
          <p className="text-muted-foreground">Manage all houses across organizations</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Houses</CardTitle>
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
                <th className="p-3 text-left text-sm font-medium">House Name</th>
                <th className="p-3 text-left text-sm font-medium">Organization</th>
                <th className="p-3 text-left text-sm font-medium">Members</th>
                <th className="p-3 text-left text-sm font-medium">Events</th>
                <th className="p-3 text-left text-sm font-medium">Tickets</th>
                <th className="p-3 text-left text-sm font-medium">Private</th>
                <th className="p-3 text-left text-sm font-medium">Created</th>
                <th className="p-3 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {houses.map((house) => (
                <tr key={house.id} className="border-t">
                  <td className="p-3 font-medium">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-muted-foreground" />
                      {house.name}
                    </div>
                    <p className="text-xs text-muted-foreground">{house.slug}</p>
                  </td>
                  <td className="p-3">
                    <Link href={`/admin/organizations/${house.organization.id}`} className="text-primary hover:underline">
                      {house.organization.name}
                    </Link>
                  </td>
                  <td className="p-3 text-sm">{house._count.members}</td>
                  <td className="p-3 text-sm">{house._count.events}</td>
                  <td className="p-3 text-sm">{house._count.tickets}</td>
                  <td className="p-3">
                    {house.isPrivate ? (
                      <span className="inline-flex rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
                        Private
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">
                        Public
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-sm">
                    {new Date(house.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    <Link href={`/admin/organizations/${house.organization.id}`}>
                      <Button variant="ghost" size="sm">View Org</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {houses.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No houses found</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`?page=${p}&search=${search}&organizationId=${organizationId || ""}`}
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