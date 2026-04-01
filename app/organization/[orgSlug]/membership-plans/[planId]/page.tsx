import { notFound } from "next/navigation"
import Link from "next/link"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Separator } from "@/components/ui/Separator"
import { 
  DollarSign, 
  Calendar, 
  Percent, 
  Users, 
  FileText, 
  Edit, 
  ArrowLeft,
  CheckCircle,
  Home,
  Building2
} from "lucide-react"
import { format } from "date-fns"

interface PlanPageProps {
  params: Promise<{ orgSlug: string; planId: string }>
}

export default async function MembershipPlanDetailPage({ params }: PlanPageProps) {
  const session = await getServerSession(authOptions)
  const { orgSlug, planId } = await params

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

  const plan = await prisma.membershipPlan.findFirst({
    where: {
      id: planId,
      organizationId: organization.id,
    },
    include: {
      house: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      _count: {
        select: {
          applications: true,
          memberships: true,
        },
      },
    },
  })

  if (!plan) {
    notFound()
  }

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

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "STANDARD":
        return <Badge variant="outline">Standard</Badge>
      case "PREMIUM":
        return <Badge variant="outline" className="bg-purple-100 text-purple-800">Premium</Badge>
      case "VIP":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">VIP</Badge>
      case "CUSTOM":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Custom</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  const features = plan.features as string[] || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/organization/${orgSlug}/membership-plans`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{plan.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              {getTypeBadge(plan.type)}
              {getStatusBadge(plan.status)}
              {plan.isPublic ? (
                <Badge variant="outline" className="bg-blue-100 text-blue-800">Public</Badge>
              ) : (
                <Badge variant="outline" className="bg-gray-100 text-gray-800">Private</Badge>
              )}
              {plan.requiresApproval && (
                <Badge variant="outline" className="bg-orange-100 text-orange-800">Requires Approval</Badge>
              )}
            </div>
          </div>
        </div>
        <Link href={`/organization/${orgSlug}/membership-plans/${planId}/edit`}>
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Edit Plan
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Pricing Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-3xl font-bold">
                ${plan.amount}
                <span className="text-lg font-normal text-muted-foreground">
                  /{formatBillingFrequency(plan.billingFrequency)}
                </span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {plan.currency} per {formatBillingFrequency(plan.billingFrequency).toLowerCase()}
              </p>
            </div>
            <Separator />
            <div className="space-y-2">
              {plan.setupFee && plan.setupFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Setup Fee</span>
                  <span>${plan.setupFee}</span>
                </div>
              )}
              {plan.vatRate && plan.vatRate > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VAT</span>
                  <span>{plan.vatRate}%</span>
                </div>
              )}
              <div className="flex justify-between font-medium">
                <span>Total (incl. VAT)</span>
                <span>
                  ${(plan.amount * (1 + (plan.vatRate || 0) / 100)).toFixed(2)}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{formatBillingFrequency(plan.billingFrequency)}
                  </span>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Members</p>
                <p className="text-2xl font-bold">{plan._count.memberships}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Applications</p>
                <p className="text-2xl font-bold">{plan._count.applications}</p>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Monthly Recurring Revenue</p>
              <p className="text-xl font-bold">
                ${(plan.amount * plan._count.memberships).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">{format(new Date(plan.createdAt), "MMMM d, yyyy")}</p>
            </div>
            {plan.house && (
              <div>
                <p className="text-sm text-muted-foreground">House</p>
                <Link href={`/organization/${orgSlug}/houses/${plan.house.slug}`} className="font-medium text-primary hover:underline flex items-center gap-1">
                  <Home className="h-3 w-3" />
                  {plan.house.name}
                </Link>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Organization</p>
              <p className="font-medium flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {organization.name}
              </p>
            </div>
            {plan.description && (
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="text-sm mt-1">{plan.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Features Section */}
      {features.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Features Included
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions Section */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Link href={`/organization/${orgSlug}/membership-plans/${planId}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit Plan
            </Button>
          </Link>
          <Link href={`/membership/apply/${orgSlug}`}>
            <Button>
              View Public Application Page
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}