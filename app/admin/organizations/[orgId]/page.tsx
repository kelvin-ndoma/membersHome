import { notFound } from "next/navigation"
import Link from "next/link"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Building2, Users, Home, Calendar, Ticket, DollarSign, Edit, Trash2, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import DeleteOrganizationButton from "@/components/admin/DeleteOrganizationButton"

interface OrgPageProps {
  params: Promise<{ orgId: string }>
}

export default async function OrganizationDetailPage({ params }: OrgPageProps) {
  const session = await getServerSession(authOptions)
  const { orgId } = await params

  if (!session || session.user.platformRole !== "PLATFORM_ADMIN") {
    redirect("/")
  }

  const organization = await prisma.organization.findUnique({
    where: { id: orgId },
    include: {
      _count: {
        select: {
          memberships: true,
          houses: true,
          events: true,
          tickets: true,
          invoices: true,
        },
      },
      memberships: {
        take: 5,
        orderBy: { joinedAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  })

  if (!organization) {
    notFound()
  }

  const stats = [
    { title: "Members", value: organization._count.memberships, icon: Users },
    { title: "Houses", value: organization._count.houses, icon: Home },
    { title: "Events", value: organization._count.events, icon: Calendar },
    { title: "Tickets", value: organization._count.tickets, icon: Ticket },
    { title: "Invoices", value: organization._count.invoices, icon: DollarSign },
  ]

  const isDeleted = organization.status === "CANCELLED"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{organization.name}</h1>
          <p className="text-muted-foreground">{organization.slug}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/organizations/${orgId}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          {!isDeleted && <DeleteOrganizationButton orgId={orgId} orgName={organization.name} />}
        </div>
      </div>

      {isDeleted && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">This organization has been deleted</span>
          </div>
          <p className="mt-1 text-sm">Deleted on {format(new Date(organization.suspendedAt || organization.updatedAt), "MMM d, yyyy")}</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Plan</p>
              <p className="font-medium">{organization.plan}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium">{organization.status === "CANCELLED" ? "Deleted" : organization.status}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">{format(new Date(organization.createdAt), "MMM d, yyyy")}</p>
            </div>
            {organization.website && (
              <div>
                <p className="text-sm text-muted-foreground">Website</p>
                <a href={organization.website} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                  {organization.website}
                </a>
              </div>
            )}
            {organization.billingEmail && (
              <div>
                <p className="text-sm text-muted-foreground">Billing Email</p>
                <p className="font-medium">{organization.billingEmail}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {organization.memberships.map((member) => (
              <div key={member.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                <div>
                  <p className="font-medium">{member.user.name}</p>
                  <p className="text-sm text-muted-foreground">{member.user.email}</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  {member.organizationRole} • Joined {format(new Date(member.joinedAt), "MMM d, yyyy")}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}