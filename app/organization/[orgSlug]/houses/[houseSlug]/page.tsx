// app/organization/[orgSlug]/houses/[houseSlug]/page.tsx
import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Home, Users, Calendar, Ticket, DollarSign, ClipboardList, ArrowRight } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

interface HouseDashboardPageProps {
  params: Promise<{ orgSlug: string; houseSlug: string }>
}

export default async function HouseDashboardPage({ params }: HouseDashboardPageProps) {
  const session = await getServerSession(authOptions)
  const { orgSlug, houseSlug } = await params

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
    select: { id: true },
  })

  if (!organization) {
    notFound()
  }

  const house = await prisma.house.findFirst({
    where: {
      slug: houseSlug,
      organizationId: organization.id,
    },
    include: {
      _count: {
        select: {
          members: {
            where: { status: "ACTIVE" }
          },
          events: {
            where: { status: "PUBLISHED" }
          },
          tickets: true,
        },
      },
    },
  })

  if (!house) {
    notFound()
  }

  // Get pending applications count
  const pendingApplications = await prisma.membershipApplication.count({
    where: {
      membershipPlan: {
        houseId: house.id,
      },
      status: "PENDING",
    },
  })

  // Get membership plans count
  const membershipPlansCount = await prisma.membershipPlan.count({
    where: {
      houseId: house.id,
      status: "ACTIVE",
    },
  })

  // Get upcoming events
  const upcomingEvents = await prisma.event.findMany({
    where: {
      houseId: house.id,
      startDate: { gte: new Date() },
      status: "PUBLISHED",
    },
    take: 5,
    orderBy: { startDate: "asc" },
    include: {
      _count: {
        select: { rsvps: true },
      },
    },
  })

  const stats = [
    {
      title: "Active Members",
      value: house._count.members,
      icon: Users,
      href: `/organization/${orgSlug}/houses/${houseSlug}/members`,
      color: "bg-blue-500/10 text-blue-500",
    },
    {
      title: "Membership Plans",
      value: membershipPlansCount,
      icon: DollarSign,
      href: `/organization/${orgSlug}/houses/${houseSlug}/membership-plans`,
      color: "bg-green-500/10 text-green-500",
    },
    {
      title: "Pending Applications",
      value: pendingApplications,
      icon: ClipboardList,
      href: `/organization/${orgSlug}/houses/${houseSlug}/applications`,
      color: "bg-yellow-500/10 text-yellow-500",
    },
    {
      title: "Upcoming Events",
      value: upcomingEvents.length,
      icon: Calendar,
      href: `/organization/${orgSlug}/houses/${houseSlug}/events`,
      color: "bg-purple-500/10 text-purple-500",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Home className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">{house.name}</h1>
        </div>
        {house.description && (
          <p className="text-muted-foreground mt-1">{house.description}</p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
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
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link href={`/organization/${orgSlug}/houses/${houseSlug}/members/invite`}>
              <Button className="w-full" variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Invite Members
              </Button>
            </Link>
            <Link href={`/organization/${orgSlug}/houses/${houseSlug}/membership-plans/create`}>
              <Button className="w-full" variant="outline">
                <DollarSign className="mr-2 h-4 w-4" />
                Create Plan
              </Button>
            </Link>
            <Link href={`/organization/${orgSlug}/houses/${houseSlug}/events/create`}>
              <Button className="w-full" variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Create Event
              </Button>
            </Link>
            <Link href={`/organization/${orgSlug}/houses/${houseSlug}/tickets/create`}>
              <Button className="w-full" variant="outline">
                <Ticket className="mr-2 h-4 w-4" />
                Create Ticket
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Events Preview */}
      {upcomingEvents.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming Events</CardTitle>
            <Link href={`/organization/${orgSlug}/houses/${houseSlug}/events`}>
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div>
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(event.startDate), "MMM d, h:mm a")}
                    </p>
                  </div>
                  <Badge variant="secondary">{event._count.rsvps} RSVPs</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ")
}