// app/organization/[orgSlug]/dashboard/page.tsx
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Building2, Users, Calendar, DollarSign, TrendingUp, ArrowRight, Home, Plus } from "lucide-react"
import Link from "next/link"
import { HouseSelector } from "@/components/organization/HouseSelector"

interface OrganizationDashboardPageProps {
  params: Promise<{ orgSlug: string }>
}

export default async function OrganizationDashboardPage({ params }: OrganizationDashboardPageProps) {
  const session = await getServerSession(authOptions)
  const { orgSlug } = await params

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

  const isOrgAdmin = membership.organizationRole === "ORG_ADMIN" || membership.organizationRole === "ORG_OWNER"

  if (!isOrgAdmin) {
    redirect(`/portal/${orgSlug}/dashboard`)
  }

  const organization = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: { id: true, name: true, logoUrl: true },
  })

  if (!organization) {
    redirect("/organization")
  }

  // Get all houses with their stats
  const houses = await prisma.house.findMany({
    where: { organizationId: organization.id },
    include: {
      _count: {
        select: {
          members: {
            where: { status: "ACTIVE" }
          },
          events: {
            where: { status: "PUBLISHED" }
          },
        },
      },
      membershipPlans: {
        where: { status: "ACTIVE" },
        select: { id: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  // Get organization-wide stats
  const totalMembers = await prisma.houseMembership.count({
    where: {
      house: {
        organizationId: organization.id,
      },
      status: "ACTIVE",
    },
  })

  const totalEvents = await prisma.event.count({
    where: {
      organizationId: organization.id,
      status: "PUBLISHED",
    },
  })

  const totalMembershipPlans = await prisma.membershipPlan.count({
    where: {
      organizationId: organization.id,
      status: "ACTIVE",
    },
  })

  const pendingApplications = await prisma.membershipApplication.count({
    where: {
      organizationId: organization.id,
      status: "PENDING",
    },
  })

  const stats = [
    {
      title: "Total Houses",
      value: houses.length,
      icon: Building2,
      color: "bg-blue-500/10 text-blue-500",
    },
    {
      title: "Total Members",
      value: totalMembers,
      icon: Users,
      color: "bg-green-500/10 text-green-500",
    },
    {
      title: "Total Events",
      value: totalEvents,
      icon: Calendar,
      color: "bg-purple-500/10 text-purple-500",
    },
    {
      title: "Pending Applications",
      value: pendingApplications,
      icon: TrendingUp,
      color: "bg-yellow-500/10 text-yellow-500",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Organization Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of {organization.name}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={cn("p-2 rounded-full", stat.color)}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link href={`/organization/${orgSlug}/houses/create`}>
              <Button className="w-full" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Create New House
              </Button>
            </Link>
            <Link href={`/organization/${orgSlug}/membership-plans`}>
              <Button className="w-full" variant="outline">
                <DollarSign className="mr-2 h-4 w-4" />
                Manage Plans
              </Button>
            </Link>
            <Link href={`/organization/${orgSlug}/membership-applications`}>
              <Button className="w-full" variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Review Applications
              </Button>
            </Link>
            <Link href={`/organization/${orgSlug}/billing`}>
              <Button className="w-full" variant="outline">
                <DollarSign className="mr-2 h-4 w-4" />
                Billing
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Houses List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Your Houses</h2>
          <Link href={`/organization/${orgSlug}/houses`}>
            <Button variant="ghost" size="sm">
              View All Houses
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {houses.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Home className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No houses yet</h3>
              <p className="mt-2 text-muted-foreground">
                Create your first house to start managing members and events
              </p>
              <Link href={`/organization/${orgSlug}/houses/create`}>
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Create House
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {houses.map((house) => (
              <Link key={house.id} href={`/organization/${orgSlug}/houses/${house.slug}`}>
                <Card className="hover:shadow-lg transition-all cursor-pointer group">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Home className="h-5 w-5 text-primary" />
                        <CardTitle className="text-xl">{house.name}</CardTitle>
                      </div>
                      {house.isPrivate && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          Private
                        </span>
                      )}
                    </div>
                    {house.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {house.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{house._count.members} members</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{house._count.events} events</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>{house.membershipPlans.length} plans</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardContent className="pt-0">
                    <Button 
                      variant="outline" 
                      className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    >
                      Manage House
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ")
}