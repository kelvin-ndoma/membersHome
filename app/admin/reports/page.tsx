import { Suspense } from "react"
import { format } from "date-fns"
import Link from "next/link"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select"
import { Badge } from "@/components/ui/Badge"
import { Download, FileText, TrendingUp, Users, Calendar, DollarSign, Eye, BarChart3 } from "lucide-react"

interface SearchParams {
  page?: string
  type?: string
  startDate?: string
  endDate?: string
}

export default async function AdminReportsPage({
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
  const type = params.type
  const startDate = params.startDate
  const endDate = params.endDate

  const where: any = {}

  if (type) {
    where.type = type
  }

  if (startDate || endDate) {
    where.generatedAt = {}
    if (startDate) {
      where.generatedAt.gte = new Date(startDate)
    }
    if (endDate) {
      where.generatedAt.lte = new Date(endDate)
    }
  }

  const [reports, total, reportTypes] = await Promise.all([
    prisma.report.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { generatedAt: "desc" },
      include: {
        generator: {
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
    prisma.report.count({ where }),
    prisma.report.groupBy({
      by: ["type"],
      _count: true,
    }),
  ])

  const totalPages = Math.ceil(total / pageSize)

  const getReportIcon = (type: string) => {
    switch (type) {
      case "MEMBERSHIP_GROWTH":
        return <Users className="h-4 w-4" />
      case "EVENT_ATTENDANCE":
        return <Calendar className="h-4 w-4" />
      case "REVENUE_ANALYSIS":
        return <DollarSign className="h-4 w-4" />
      case "TICKET_SALES":
        return <TrendingUp className="h-4 w-4" />
      default:
        return <BarChart3 className="h-4 w-4" />
    }
  }

  const getReportTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      MEMBERSHIP_GROWTH: "Membership Growth",
      EVENT_ATTENDANCE: "Event Attendance",
      REVENUE_ANALYSIS: "Revenue Analysis",
      TICKET_SALES: "Ticket Sales",
      PLATFORM_OVERVIEW: "Platform Overview",
    }
    return labels[type] || type
  }

  const getAccessLevelBadge = (level: string) => {
    const colors: Record<string, string> = {
      PLATFORM: "bg-purple-100 text-purple-800",
      ORGANIZATION: "bg-blue-100 text-blue-800",
      HOUSE_ONLY: "bg-green-100 text-green-800",
    }
    return colors[level] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Platform Reports</h1>
          <p className="text-muted-foreground">View and manage all generated reports</p>
        </div>
        <Link href="/admin/reports/generate">
          <Button>
            <FileText className="mr-2 h-4 w-4" />
            Generate New Report
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Report Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportTypes.length}</div>
          </CardContent>
        </Card>
        <Card className="col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 text-sm">
              {reportTypes.slice(0, 3).map((type) => (
                <div key={type.type}>
                  <span className="font-medium">{getReportTypeLabel(type.type)}</span>
                  <span className="ml-1 text-muted-foreground">{type._count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <form method="GET" className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[150px]">
              <Select name="type" defaultValue={type || ""}>
                <SelectTrigger>
                  <SelectValue placeholder="Report Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="MEMBERSHIP_GROWTH">Membership Growth</SelectItem>
                  <SelectItem value="EVENT_ATTENDANCE">Event Attendance</SelectItem>
                  <SelectItem value="REVENUE_ANALYSIS">Revenue Analysis</SelectItem>
                  <SelectItem value="TICKET_SALES">Ticket Sales</SelectItem>
                  <SelectItem value="PLATFORM_OVERVIEW">Platform Overview</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-auto">
              <Input type="date" name="startDate" placeholder="Start Date" defaultValue={startDate || ""} />
            </div>
            <div className="w-auto">
              <Input type="date" name="endDate" placeholder="End Date" defaultValue={endDate || ""} />
            </div>
            <Button type="submit">Apply Filters</Button>
            <Link href="/admin/reports">
              <Button type="button" variant="ghost">Clear</Button>
            </Link>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generated Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1 text-primary">
                        {getReportIcon(report.type)}
                        <span className="font-medium">{report.title}</span>
                      </div>
                      <Badge variant="outline" className={getAccessLevelBadge(report.accessLevel)}>
                        {report.accessLevel}
                      </Badge>
                    </div>
                    {report.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{report.description}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span>Type: {getReportTypeLabel(report.type)}</span>
                      <span>Generated by: {report.generator.name || report.generator.email}</span>
                      {report.organization && (
                        <span>Organization: {report.organization.name}</span>
                      )}
                      {report.house && (
                        <span>House: {report.house.name}</span>
                      )}
                      <span>
                        Generated: {format(new Date(report.generatedAt), "MMM d, yyyy h:mm a")}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/admin/reports/${report.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/admin/reports/${report.id}/download`}>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
            {reports.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">No reports found</p>
                <Link href="/admin/reports/generate">
                  <Button variant="link" className="mt-2">
                    Generate your first report
                  </Button>
                </Link>
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
              href={`?page=${p}&type=${type || ""}&startDate=${startDate || ""}&endDate=${endDate || ""}`}
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
                href={`?page=${totalPages}&type=${type || ""}&startDate=${startDate || ""}&endDate=${endDate || ""}`}
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