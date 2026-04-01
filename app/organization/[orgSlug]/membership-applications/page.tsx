import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Eye, CheckCircle, XCircle, Clock, Ban, FileText, ListChecks, Home } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

interface ApplicationsPageProps {
  params: Promise<{ orgSlug: string }>
  searchParams: Promise<{ status?: string; houseId?: string }>
}

export default async function MembershipApplicationsPage({ params, searchParams }: ApplicationsPageProps) {
  const session = await getServerSession(authOptions)
  const { orgSlug } = await params
  const { status = "all", houseId } = await searchParams

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

  if (!membership || (membership.organizationRole !== "ORG_ADMIN" && membership.organizationRole !== "ORG_OWNER")) {
    redirect(`/organization/${orgSlug}/dashboard`)
  }

  const organization = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: { id: true, name: true },
  })

  if (!organization) {
    redirect(`/organization/${orgSlug}/dashboard`)
  }

  // Get selected house info if houseId is provided
  let selectedHouse = null
  let planIds: string[] = []

  if (houseId) {
    selectedHouse = await prisma.house.findFirst({
      where: {
        id: houseId,
        organizationId: organization.id,
      },
      select: { id: true, name: true, slug: true },
    })

    // Get all membership plans for this house
    const housePlans = await prisma.membershipPlan.findMany({
      where: {
        houseId: selectedHouse?.id,
        status: "ACTIVE",
      },
      select: { id: true },
    })
    planIds = housePlans.map(plan => plan.id)
  }

  // Build where clause
  const where: any = { organizationId: organization.id }
  
  // If house is selected, only show applications for that house's plans
  if (houseId && planIds.length > 0) {
    where.membershipPlanId = { in: planIds }
  }
  
  if (status !== "all") {
    where.status = status.toUpperCase()
  }

  const applications = await prisma.membershipApplication.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      membershipPlan: {
        include: {
          house: true,
        },
      },
      reviewer: {
        select: { name: true, email: true },
      },
      membership: {
        select: {
          id: true,
          status: true,
          startDate: true,
          cancelledAt: true,
        },
      },
    },
  })

  const statusCounts = await prisma.membershipApplication.groupBy({
    by: ["status"],
    where: {
      organizationId: organization.id,
      ...(houseId && planIds.length > 0 ? { membershipPlanId: { in: planIds } } : {}),
    },
    _count: true,
  })

  const getStatusBadge = (applicationStatus: string, membershipStatus?: string) => {
    // For approved applications, check if the membership is cancelled
    if (applicationStatus === "APPROVED" && membershipStatus === "CANCELLED") {
      return <Badge className="bg-orange-100 text-orange-800">Cancelled</Badge>
    }
    
    switch (applicationStatus) {
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "REVIEWING":
        return <Badge className="bg-blue-100 text-blue-800">Reviewing</Badge>
      case "APPROVED":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case "REJECTED":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      case "WAITLIST":
        return <Badge className="bg-gray-100 text-gray-800">Waitlist</Badge>
      case "CANCELLED":
        return <Badge className="bg-orange-100 text-orange-800">Cancelled</Badge>
      default:
        return <Badge>{applicationStatus}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "REVIEWING":
        return <Eye className="h-4 w-4 text-blue-500" />
      case "APPROVED":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "REJECTED":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "WAITLIST":
        return <Clock className="h-4 w-4 text-gray-500" />
      case "CANCELLED":
        return <Ban className="h-4 w-4 text-orange-500" />
      default:
        return <ListChecks className="h-4 w-4" />
    }
  }

  const getCount = (status: string) => {
    const found = statusCounts.find(s => s.status === status)
    return found?._count || 0
  }

  const totalCount = applications.length

  // Also count approved applications that have cancelled memberships
  const cancelledCount = applications.filter(app => 
    app.status === "APPROVED" && app.membership?.status === "CANCELLED"
  ).length

  // Helper to build URLs with house context
  const buildUrl = (newStatus?: string) => {
    let url = `/organization/${orgSlug}/membership-applications`
    const params = new URLSearchParams()
    
    if (houseId) {
      params.set("houseId", houseId)
    }
    if (newStatus && newStatus !== "all") {
      params.set("status", newStatus)
    }
    
    const queryString = params.toString()
    if (queryString) {
      url += `?${queryString}`
    }
    return url
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {selectedHouse ? `${selectedHouse.name} - ` : ""}Membership Applications
        </h1>
        <p className="text-muted-foreground">
          {selectedHouse 
            ? `Review and process membership applications for ${selectedHouse.name}`
            : "Review and process membership applications across all houses"}
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-6">
        <Link href={buildUrl()}>
          <Card className={`hover:shadow-lg transition-shadow cursor-pointer ${status === "all" ? "border-primary" : ""}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">All</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCount}</div>
            </CardContent>
          </Card>
        </Link>
        <Link href={buildUrl("pending")}>
          <Card className={`hover:shadow-lg transition-shadow cursor-pointer ${status === "pending" ? "border-primary" : ""}`}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getCount("PENDING")}</div>
            </CardContent>
          </Card>
        </Link>
        <Link href={buildUrl("reviewing")}>
          <Card className={`hover:shadow-lg transition-shadow cursor-pointer ${status === "reviewing" ? "border-primary" : ""}`}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Reviewing</CardTitle>
              <Eye className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getCount("REVIEWING")}</div>
            </CardContent>
          </Card>
        </Link>
        <Link href={buildUrl("approved")}>
          <Card className={`hover:shadow-lg transition-shadow cursor-pointer ${status === "approved" ? "border-primary" : ""}`}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getCount("APPROVED")}</div>
            </CardContent>
          </Card>
        </Link>
        <Link href={buildUrl("waitlist")}>
          <Card className={`hover:shadow-lg transition-shadow cursor-pointer ${status === "waitlist" ? "border-primary" : ""}`}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Waitlist</CardTitle>
              <Clock className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getCount("WAITLIST")}</div>
            </CardContent>
          </Card>
        </Link>
        <Link href={buildUrl("cancelled")}>
          <Card className={`hover:shadow-lg transition-shadow cursor-pointer ${status === "cancelled" ? "border-primary" : ""}`}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
              <Ban className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getCount("CANCELLED") + cancelledCount}</div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedHouse ? `Applications for ${selectedHouse.name}` : "All Applications"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">No applications found</p>
              <p className="text-sm text-muted-foreground">
                {selectedHouse 
                  ? `Applications will appear here when members apply for plans in ${selectedHouse.name}`
                  : "Applications will appear here when members submit membership applications"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => {
                const isCancelledMembership = app.status === "APPROVED" && app.membership?.status === "CANCELLED"
                const reviewUrl = houseId 
                  ? `/organization/${orgSlug}/membership-applications/${app.id}?houseId=${houseId}`
                  : `/organization/${orgSlug}/membership-applications/${app.id}`
                
                return (
                  <div key={app.id} className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{app.firstName} {app.lastName}</p>
                        {getStatusBadge(app.status, app.membership?.status)}
                        {app.membershipPlan.house && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Home className="h-3 w-3" />
                            {app.membershipPlan.house.name}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{app.email}</p>
                      <div className="flex flex-wrap gap-4 mt-1">
                        <p className="text-sm text-muted-foreground">Plan: {app.membershipPlan.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Applied {format(new Date(app.createdAt), "MMM d, yyyy")}
                        </p>
                        {app.reviewedAt && (
                          <p className="text-xs text-muted-foreground">
                            Reviewed {format(new Date(app.reviewedAt), "MMM d, yyyy")}
                          </p>
                        )}
                        {isCancelledMembership && app.membership?.cancelledAt && (
                          <p className="text-xs text-orange-600">
                            Cancelled {format(new Date(app.membership.cancelledAt), "MMM d, yyyy")}
                          </p>
                        )}
                      </div>
                    </div>
                    <Link href={reviewUrl}>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Eye className="h-4 w-4" />
                        Review
                      </Button>
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Pipeline Status Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {[
              { status: "PENDING", label: "Pending", icon: Clock, color: "text-yellow-500" },
              { status: "REVIEWING", label: "Reviewing", icon: Eye, color: "text-blue-500" },
              { status: "APPROVED", label: "Approved", icon: CheckCircle, color: "text-green-500" },
              { status: "WAITLIST", label: "Waitlist", icon: Clock, color: "text-gray-500" },
              { status: "REJECTED", label: "Rejected", icon: XCircle, color: "text-red-500" },
              { status: "CANCELLED", label: "Cancelled", icon: Ban, color: "text-orange-500" },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.status} className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${item.color}`} />
                  <span className="text-sm">{item.label}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}