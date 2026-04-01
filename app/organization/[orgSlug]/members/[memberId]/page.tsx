import { notFound } from "next/navigation"
import Link from "next/link"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar"
import { 
  Mail, 
  Phone, 
  Calendar, 
  DollarSign, 
  ArrowLeft,
  CreditCard,
  AlertCircle,
  Clock
} from "lucide-react"
import { format } from "date-fns"
import { MemberActionsWrapper } from "@/components/memberships/MemberActionsWrapper"

interface MemberDetailPageProps {
  params: Promise<{ orgSlug: string; memberId: string }>
}

export default async function MemberDetailPage({ params }: MemberDetailPageProps) {
  const session = await getServerSession(authOptions)
  const { orgSlug, memberId } = await params

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

  const organization = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: { id: true, name: true },
  })

  if (!organization) {
    redirect(`/organization/${orgSlug}/dashboard`)
  }

  // Get the member (MembershipItem) details
  const member = await prisma.membershipItem.findFirst({
    where: {
      id: memberId,
      organizationId: organization.id,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          phone: true,
          createdAt: true,
        },
      },
      membershipPlan: true,
      invoices: {
        take: 5,
        orderBy: { createdAt: "desc" },
      },
      payments: {
        take: 5,
        orderBy: { createdAt: "desc" },
      },
      cancelledByUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  if (!member) {
    notFound()
  }

  const userInitials = member.user.name
    ? member.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U"

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
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "PAUSED":
        return <Badge className="bg-orange-100 text-orange-800">Paused</Badge>
      case "CANCELLED":
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>
      case "EXPIRED":
        return <Badge className="bg-gray-100 text-gray-800">Expired</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCEEDED":
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "FAILED":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const totalPaid = member.payments
    .filter(p => p.status === "SUCCEEDED")
    .reduce((sum, p) => sum + p.amount, 0)

  const totalPending = member.invoices
    .filter(i => i.status === "PENDING")
    .reduce((sum, i) => sum + i.amount, 0)

  const isPaused = member.status === "PAUSED"
  const isCancelled = member.status === "CANCELLED"

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/organization/${orgSlug}/members`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Member Details</h1>
          <p className="text-muted-foreground">
            View member information and billing history
          </p>
        </div>
      </div>

      {/* Member Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <Avatar className="h-20 w-20">
              <AvatarImage src={member.user.image || ""} />
              <AvatarFallback className="text-2xl">{userInitials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-bold">{member.user.name || "Unnamed"}</h2>
              <p className="text-muted-foreground">{member.user.email}</p>
              <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                {getStatusBadge(member.status)}
                {getPaymentStatusBadge(member.paymentStatus)}
                {member.failedPaymentCount > 0 && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {member.failedPaymentCount} Failed Payment{member.failedPaymentCount !== 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Member Since</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {format(new Date(member.startDate), "MMM d, yyyy")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plan</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{member.membershipPlan.name}</div>
            <p className="text-sm text-muted-foreground">
              ${member.amount} / {formatBillingFrequency(member.billingFrequency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalPaid.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">${totalPending.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{member.user.email}</span>
            </div>
            {member.user.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{member.user.phone}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Billing Details */}
        <Card>
          <CardHeader>
            <CardTitle>Billing Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Billing Frequency</span>
              <span className="font-medium">{formatBillingFrequency(member.billingFrequency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-medium">${member.amount}</span>
            </div>
            {member.vatRate && member.vatRate > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">VAT</span>
                <span>{member.vatRate}%</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Next Billing Date</span>
              <span className="font-medium">
                {member.nextBillingDate 
                  ? format(new Date(member.nextBillingDate), "MMM d, yyyy")
                  : "Not scheduled"}
              </span>
            </div>
            {member.stripeCustomerId && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stripe Customer ID</span>
                <span className="font-mono text-sm">{member.stripeCustomerId}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cancellation Information */}
      {(member.cancellationReason || member.cancelledAt) && (
        <Card>
          <CardHeader>
            <CardTitle>Cancellation Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {member.cancelledAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cancelled On</span>
                <span>{format(new Date(member.cancelledAt), "MMM d, yyyy")}</span>
              </div>
            )}
            {member.cancelledByUser && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cancelled By</span>
                <span>{member.cancelledByUser.name || member.cancelledByUser.email}</span>
              </div>
            )}
            {member.cancellationReason && (
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">Reason</span>
                <p className="text-sm bg-muted p-2 rounded-md">{member.cancellationReason}</p>
              </div>
            )}
            {member.endDate && member.status === "CANCELLED" && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Membership Ends</span>
                <span>{format(new Date(member.endDate), "MMM d, yyyy")}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Membership Actions */}
      {!isCancelled && (
        <Card>
          <CardHeader>
            <CardTitle>Membership Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <MemberActionsWrapper
              memberId={member.id}
              memberName={member.user.name || member.user.email}
              initialIsPaused={isPaused}
              isCancelled={isCancelled}
            />
          </CardContent>
        </Card>
      )}

      {/* Recent Invoices */}
      {member.invoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {member.invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium">{invoice.invoiceNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(invoice.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${invoice.amount}</p>
                    <Badge variant={
                      invoice.status === "PAID" ? "success" :
                      invoice.status === "PENDING" ? "secondary" : "destructive"
                    }>
                      {invoice.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Payments */}
      {member.payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {member.payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium">
                      {format(new Date(payment.createdAt), "MMM d, yyyy")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {payment.stripePaymentId ? "Stripe" : "Manual"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${payment.amount}</p>
                    {payment.status === "SUCCEEDED" ? (
                      <Badge className="bg-green-100 text-green-800">Success</Badge>
                    ) : payment.status === "PENDING" ? (
                      <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800">Failed</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}