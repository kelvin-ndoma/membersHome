import { Suspense } from "react"
import { format } from "date-fns"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Search, Filter, Download, Eye } from "lucide-react"
import Link from "next/link"

interface SearchParams {
  page?: string
  search?: string
  action?: string
  entityType?: string
  startDate?: string
  endDate?: string
}

export default async function AdminAuditLogsPage({
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
  const pageSize = 20
  const search = params.search || ""
  const action = params.action
  const entityType = params.entityType
  const startDate = params.startDate
  const endDate = params.endDate

  const where: any = {}

  if (search) {
    where.OR = [
      { action: { contains: search, mode: "insensitive" } },
      { entityType: { contains: search, mode: "insensitive" } },
      { userEmail: { contains: search, mode: "insensitive" } },
    ]
  }

  if (action) {
    where.action = action
  }

  if (entityType) {
    where.entityType = entityType
  }

  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) {
      where.createdAt.gte = new Date(startDate)
    }
    if (endDate) {
      where.createdAt.lte = new Date(endDate)
    }
  }

  const [logs, total, actions, entityTypes] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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
      },
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.groupBy({
      by: ["action"],
      _count: true,
      orderBy: { _count: { action: "desc" } },
      take: 20,
    }),
    prisma.auditLog.groupBy({
      by: ["entityType"],
      _count: true,
      orderBy: { _count: { entityType: "desc" } },
      take: 10,
    }),
  ])

  const totalPages = Math.ceil(total / pageSize)

  const getActionBadge = (action: string) => {
    if (action.includes("CREATE")) return "bg-green-100 text-green-800"
    if (action.includes("UPDATE")) return "bg-blue-100 text-blue-800"
    if (action.includes("DELETE")) return "bg-red-100 text-red-800"
    if (action.includes("LOGIN")) return "bg-purple-100 text-purple-800"
    return "bg-gray-100 text-gray-800"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">Track all platform activity and changes</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Logs
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unique Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{actions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Entity Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{entityTypes.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <form method="GET" className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  name="search"
                  placeholder="Search by action, entity, or user..."
                  defaultValue={search}
                  className="pl-9"
                />
              </div>
              <select
                name="action"
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                defaultValue={action || ""}
              >
                <option value="">All Actions</option>
                {actions.map((a) => (
                  <option key={a.action} value={a.action}>
                    {a.action} ({a._count})
                  </option>
                ))}
              </select>
              <select
                name="entityType"
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                defaultValue={entityType || ""}
              >
                <option value="">All Entity Types</option>
                {entityTypes.map((e) => (
                  <option key={e.entityType} value={e.entityType}>
                    {e.entityType} ({e._count})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              <Input
                type="date"
                name="startDate"
                placeholder="Start Date"
                defaultValue={startDate || ""}
                className="w-auto"
              />
              <Input
                type="date"
                name="endDate"
                placeholder="End Date"
                defaultValue={endDate || ""}
                className="w-auto"
              />
              <Button type="submit">Apply Filters</Button>
              <Link href="/admin/audit-logs">
                <Button type="button" variant="ghost">Clear</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {log.entityType}
                      </span>
                      {log.entityId && (
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          ID: {log.entityId}
                        </code>
                      )}
                    </div>
                    <div className="mt-2">
                      <p className="text-sm">
                        <span className="font-medium">{log.user?.name || log.userEmail || "System"}</span>
                        {log.userEmail && log.user?.name !== log.userEmail && (
                          <span className="text-muted-foreground"> ({log.userEmail})</span>
                        )}
                      </p>
                      {log.organization && (
                        <p className="text-xs text-muted-foreground">
                          Organization: {log.organization.name}
                        </p>
                      )}
                      {log.house && (
                        <p className="text-xs text-muted-foreground">
                          House: {log.house.name}
                        </p>
                      )}
                    </div>
                    {log.oldValues && (
                      <details className="mt-2">
                        <summary className="text-xs text-muted-foreground cursor-pointer">View changes</summary>
                        <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.oldValues, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(log.createdAt), "MMM d, yyyy")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(log.createdAt), "h:mm:ss a")}
                    </p>
                    {log.userIp && (
                      <p className="text-xs text-muted-foreground mt-1">{log.userIp}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {logs.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Eye className="h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">No audit logs found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`?page=${p}&search=${search}&action=${action || ""}&entityType=${entityType || ""}&startDate=${startDate || ""}&endDate=${endDate || ""}`}
              className={`px-3 py-1 rounded ${
                p === page
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              {p}
            </Link>
          ))}
          {totalPages > 10 && (
            <>
              <span>...</span>
              <Link
                href={`?page=${totalPages}&search=${search}&action=${action || ""}&entityType=${entityType || ""}&startDate=${startDate || ""}&endDate=${endDate || ""}`}
                className="px-3 py-1 rounded bg-muted hover:bg-muted/80"
              >
                {totalPages}
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  )
}