// app/organization/[orgSlug]/houses/[houseSlug]/membership-plans/page.tsx
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { DollarSign, Users, Calendar, Eye, Edit, Plus, ArrowRight } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

interface HouseMembershipPlansPageProps {
  params: Promise<{ orgSlug: string; houseSlug: string }>
}

export default async function HouseMembershipPlansPage({ params }: HouseMembershipPlansPageProps) {
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
  })

  if (!house) {
    notFound()
  }

  const plans = await prisma.membershipPlan.findMany({
    where: {
      houseId: house.id,
      organizationId: organization.id,
    },
    include: {
      _count: {
        select: {
          applications: true,
          memberships: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const formatBillingFrequency = (freq: string) => {
    const map: Record<string, string> = {
      MONTHLY: "Monthly",
      QUARTERLY: "Quarterly",
      SEMI_ANNUAL: "Semi-Annual",
      ANNUAL: "Annual"
    }
    return map[freq] || freq
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case "INACTIVE":
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
      case "ARCHIVED":
        return <Badge className="bg-yellow-100 text-yellow-800">Archived</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Membership Plans</h1>
          <p className="text-muted-foreground">
            Manage membership tiers for {house.name}
          </p>
        </div>
        <Link href={`/organization/${orgSlug}/houses/${houseSlug}/membership-plans/create`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Plan
          </Button>
        </Link>
      </div>

      {plans.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <DollarSign className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No membership plans yet</h3>
            <p className="mt-2 text-muted-foreground">
              Create your first membership plan for {house.name}
            </p>
            <Link href={`/organization/${orgSlug}/houses/${houseSlug}/membership-plans/create`}>
              <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Create Plan
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    {plan.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {plan.description}
                      </p>
                    )}
                  </div>
                  {getStatusBadge(plan.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-2xl font-bold">
                    ${plan.amount}
                    <span className="text-sm font-normal text-muted-foreground">
                      /{formatBillingFrequency(plan.billingFrequency)}
                    </span>
                  </p>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    Members
                  </span>
                  <span className="font-semibold">{plan._count.memberships}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    Applications
                  </span>
                  <span className="font-semibold">{plan._count.applications}</span>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {plan.isPublic && (
                    <Badge variant="outline" className="text-xs">Public</Badge>
                  )}
                  {plan.requiresApproval && (
                    <Badge variant="outline" className="text-xs bg-yellow-50">Requires Approval</Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {plan.type}
                  </Badge>
                </div>

                <div className="flex gap-2 pt-2">
                  <Link href={`/organization/${orgSlug}/houses/${houseSlug}/membership-plans/${plan.id}`} className="flex-1">
                    <Button variant="outline" className="w-full" size="sm">
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                  </Link>
                  <Link href={`/organization/${orgSlug}/houses/${houseSlug}/membership-plans/${plan.id}/edit`} className="flex-1">
                    <Button className="w-full" size="sm">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}