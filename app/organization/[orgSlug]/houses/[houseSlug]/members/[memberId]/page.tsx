// app/organization/[orgSlug]/houses/[houseSlug]/members/[memberId]/page.tsx
import { notFound } from "next/navigation"
import Link from "next/link"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs"
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Home, 
  DollarSign,
  Ticket,
  CalendarDays,
  Shield,
  Building2,
  CreditCard,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  RefreshCw,
  History,
  QrCode,
  Package
} from "lucide-react"
import { format } from "date-fns"
import { MemberActions } from "./MemberActions"
import { ChangePlanDialog } from "./ChangePlanDialog"
import { AddPlanDialog } from "./AddPlanDialog"
import { AddPaymentDialog } from "./AddPaymentDialog"

interface MemberProfilePageProps {
  params: Promise<{ orgSlug: string; houseSlug: string; memberId: string }>
}

export default async function MemberProfilePage({ params }: MemberProfilePageProps) {
  const session = await getServerSession(authOptions)
  const { orgSlug, houseSlug, memberId } = await params

  if (!session?.user?.id) {
    redirect("/auth/login")
  }

  // Check if user is org admin or house admin
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

  // Get the house
  const organization = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: { id: true, name: true },
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

  // Check if current user is house admin
  const currentHouseMembership = await prisma.houseMembership.findFirst({
    where: {
      houseId: house.id,
      membershipId: membership.id,
      status: "ACTIVE",
    },
  })

  const isHouseAdmin = currentHouseMembership?.role === "HOUSE_ADMIN" || isOrgAdmin

  if (!isHouseAdmin && !isOrgAdmin) {
    redirect(`/organization/${orgSlug}/houses/${houseSlug}/members`)
  }

  // Get the member's house membership
  const houseMembership = await prisma.houseMembership.findFirst({
    where: {
      id: memberId,
      houseId: house.id,
      status: "ACTIVE",
    },
    include: {
      membership: {
        include: {
          user: true,
          organization: true,
        },
      },
    },
  })

  if (!houseMembership) {
    notFound()
  }

  const member = houseMembership.membership.user

  // Get all membership items (multiple plans)
  const allMembershipItems = await prisma.membershipItem.findMany({
    where: {
      userId: member.id,
      organizationId: organization.id,
      status: "ACTIVE",
    },
    include: {
      membershipPlan: true,
    },
    orderBy: { startDate: "asc" },
  })

  const mainPlan = allMembershipItems[0]
  const additionalPlans = allMembershipItems.slice(1)

  // Get available plans for this house
  const availablePlans = await prisma.membershipPlan.findMany({
    where: {
      houseId: house.id,
      status: "ACTIVE",
    },
  })

  // Get member's events (RSVPs)
  const upcomingEvents = await prisma.rSVP.findMany({
    where: {
      membershipId: houseMembership.membership.id,
      event: {
        startDate: { gte: new Date() },
        status: "PUBLISHED",
      },
    },
    include: {
      event: {
        include: {
          house: true,
        },
      },
    },
    orderBy: { event: { startDate: "asc" } },
  })

  // Get past events
  const pastEvents = await prisma.rSVP.findMany({
    where: {
      membershipId: houseMembership.membership.id,
      event: {
        startDate: { lt: new Date() },
      },
    },
    include: {
      event: {
        include: {
          house: true,
        },
      },
    },
    orderBy: { event: { startDate: "desc" } },
    take: 10,
  })

  // Get member's ticket purchases
  const ticketPurchases = await prisma.ticketPurchase.findMany({
    where: {
      membershipId: houseMembership.membership.id,
    },
    include: {
      ticket: {
        include: {
          event: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  // Get member's ticket validations (check-ins)
  const ticketValidations = await prisma.ticketValidation.findMany({
    where: {
      purchase: {
        membershipId: houseMembership.membership.id,
      },
    },
    include: {
      purchase: {
        include: {
          ticket: {
            include: {
              event: true,
            },
          },
        },
      },
    },
    orderBy: { validatedAt: "desc" },
    take: 20,
  })

  // Get member's payment history
  const payments = await prisma.payment.findMany({
    where: {
      userId: member.id,
      organizationId: organization.id,
    },
    include: {
      membershipItem: {
        include: {
          membershipPlan: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  // Get member's invoices
  const invoices = await prisma.invoice.findMany({
    where: {
      membershipId: houseMembership.membership.id,
    },
    orderBy: { createdAt: "desc" },
  })

  // Calculate total monthly recurring revenue
  const calculateMonthlyAmount = (item: any) => {
    let monthlyAmount = item.amount
    switch (item.billingFrequency) {
      case "QUARTERLY":
        monthlyAmount = item.amount / 3
        break
      case "SEMI_ANNUAL":
        monthlyAmount = item.amount / 6
        break
      case "ANNUAL":
        monthlyAmount = item.amount / 12
        break
    }
    return monthlyAmount
  }

  const totalMonthly = allMembershipItems.reduce((sum, item) => sum + calculateMonthlyAmount(item), 0)

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "HOUSE_ADMIN":
        return <Badge className="bg-purple-100 text-purple-800">Admin</Badge>
      case "HOUSE_MANAGER":
        return <Badge className="bg-blue-100 text-blue-800">Manager</Badge>
      case "HOUSE_STAFF":
        return <Badge className="bg-green-100 text-green-800">Staff</Badge>
      default:
        return <Badge variant="outline">Member</Badge>
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCEEDED":
        return <Badge className="bg-green-100 text-green-800">Success</Badge>
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "FAILED":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getInvoiceStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "OVERDUE":
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getMembershipStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "CANCELLED":
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>
      case "EXPIRED":
        return <Badge className="bg-gray-100 text-gray-800">Expired</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/organization/${orgSlug}/houses/${houseSlug}/members`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{member.name || "Member"}</h1>
              {getRoleBadge(houseMembership.role)}
            </div>
            <div className="flex items-center gap-2 mt-1 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{member.email}</span>
              {member.phone && (
                <>
                  <Phone className="h-4 w-4 ml-2" />
                  <span>{member.phone}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <MemberActions
          memberId={houseMembership.id}
          currentRole={houseMembership.role}
          currentStaffPosition={houseMembership.staffPosition}
          currentManagerLevel={houseMembership.managerLevel}
          memberName={member.name || member.email}
          memberEmail={member.email}
          orgSlug={orgSlug}
          houseSlug={houseSlug}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Member Since</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {format(new Date(houseMembership.joinedAt), "MMM d, yyyy")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Plans</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allMembershipItems.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalMonthly.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Billing</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {mainPlan?.nextBillingDate ? (
              <>
                <div className="text-xl font-bold">
                  {format(new Date(mainPlan.nextBillingDate), "MMM d, yyyy")}
                </div>
                {new Date(mainPlan.nextBillingDate) < new Date() && (
                  <Badge className="mt-1 bg-red-100 text-red-800">Past Due</Badge>
                )}
              </>
            ) : (
              <div className="text-lg font-medium">N/A</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="membership" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
          <TabsTrigger value="membership">Membership</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="checkins">Check-ins</TabsTrigger>
        </TabsList>

        {/* Membership Tab */}
        <TabsContent value="membership" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Membership Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Membership Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Status</span>
                    {getMembershipStatusBadge(houseMembership.membership.status)}
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Role in House</span>
                    {getRoleBadge(houseMembership.role)}
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Joined House</span>
                    <span>{format(new Date(houseMembership.joinedAt), "MMMM d, yyyy")}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Organization Role</span>
                    <Badge variant="outline">
                      {houseMembership.membership.organizationRole}
                    </Badge>
                  </div>
                  {houseMembership.staffPosition && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Staff Position</span>
                      <span>{houseMembership.staffPosition}</span>
                    </div>
                  )}
                  {houseMembership.managerLevel && (
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Manager Level</span>
                      <span>Level {houseMembership.managerLevel}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Membership Plans */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Membership Plans
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {allMembershipItems.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">No active plans</p>
                    <div className="mt-4">
                      <AddPlanDialog
                        memberId={houseMembership.id}
                        availablePlans={availablePlans}
                        orgSlug={orgSlug}
                        houseSlug={houseSlug}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Main Plan */}
                    {mainPlan && (
                      <div className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-lg">{mainPlan.membershipPlan.name}</p>
                              <Badge className="bg-primary/10 text-primary">Main Plan</Badge>
                            </div>
                            {mainPlan.membershipPlan.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {mainPlan.membershipPlan.description}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline" className="text-sm">
                            ${mainPlan.amount}/{mainPlan.billingFrequency.toLowerCase()}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t">
                          <div>
                            <p className="text-xs text-muted-foreground">Started</p>
                            <p className="text-sm font-medium">
                              {format(new Date(mainPlan.startDate), "MMM d, yyyy")}
                            </p>
                          </div>
                          {mainPlan.nextBillingDate && (
                            <div>
                              <p className="text-xs text-muted-foreground">Next Billing</p>
                              <p className="text-sm font-medium">
                                {format(new Date(mainPlan.nextBillingDate), "MMM d, yyyy")}
                                {new Date(mainPlan.nextBillingDate) < new Date() && (
                                  <Badge className="ml-2 bg-red-100 text-red-800 text-xs">Past Due</Badge>
                                )}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="mt-4 flex gap-2">
                          <ChangePlanDialog
                            membershipItemId={mainPlan.id}
                            currentPlanId={mainPlan.membershipPlanId}
                            availablePlans={availablePlans.filter(p => p.id !== mainPlan.membershipPlanId)}
                            orgSlug={orgSlug}
                            houseSlug={houseSlug}
                            memberId={member.id}
                          />
                          <AddPlanDialog
                            memberId={houseMembership.id}
                            availablePlans={availablePlans.filter(p => 
                              !allMembershipItems.some(i => i.membershipPlanId === p.id)
                            )}
                            orgSlug={orgSlug}
                            houseSlug={houseSlug}
                          />
                        </div>
                      </div>
                    )}

                    {/* Additional Plans */}
                    {additionalPlans.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="text-sm font-medium mb-3">Additional Plans</h4>
                        <div className="space-y-3">
                          {additionalPlans.map((item) => (
                            <div key={item.id} className="border rounded-lg p-3 bg-muted/30">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium">{item.membershipPlan.name}</p>
                                  {item.membershipPlan.description && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {item.membershipPlan.description}
                                    </p>
                                  )}
                                </div>
                                <Badge variant="outline" className="text-sm">
                                  ${item.amount}/{item.billingFrequency.toLowerCase()}
                                </Badge>
                              </div>
                              <div className="flex justify-between mt-3 text-sm">
                                <span className="text-muted-foreground">Added:</span>
                                <span>{format(new Date(item.startDate), "MMM d, yyyy")}</span>
                              </div>
                              {item.nextBillingDate && (
                                <div className="flex justify-between mt-2 text-sm">
                                  <span className="text-muted-foreground">Next Billing:</span>
                                  <span>{format(new Date(item.nextBillingDate), "MMM d, yyyy")}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Invoices */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Invoices
                </CardTitle>
              </CardHeader>
              <CardContent>
                {invoices.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground">No invoices found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {invoices.map((invoice) => (
                      <div key={invoice.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                        <div>
                          <p className="font-medium">Invoice #{invoice.invoiceNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(invoice.createdAt), "MMM d, yyyy")}
                          </p>
                          {invoice.description && (
                            <p className="text-xs text-muted-foreground">{invoice.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {invoice.currency} {invoice.amount}
                          </p>
                          {getInvoiceStatusBadge(invoice.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Total Paid</span>
                  <span className="font-semibold text-lg">
                    ${payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Total Invoices</span>
                  <span className="font-semibold">{invoices.length}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Outstanding Balance</span>
                  <span className="font-semibold text-red-600">
                    ${invoices.filter(i => i.status !== "PAID").reduce((sum, i) => sum + i.amount, 0).toLocaleString()}
                  </span>
                </div>
                <div className="pt-4">
                  <AddPaymentDialog
                    memberId={member.id}
                    orgSlug={orgSlug}
                    houseSlug={houseSlug}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">No payments found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                      <div>
                        <p className="font-medium">
                          {payment.currency} {payment.amount}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {payment.description || "Membership payment"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(payment.createdAt), "MMM d, yyyy • h:mm a")}
                        </p>
                        {payment.membershipItem?.membershipPlan && (
                          <p className="text-xs text-muted-foreground">
                            Plan: {payment.membershipItem.membershipPlan.name}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        {getPaymentStatusBadge(payment.status)}
                        {payment.paidAt && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Paid: {format(new Date(payment.paidAt), "MMM d, yyyy")}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  Upcoming Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground">No upcoming events</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingEvents.map((rsvp) => (
                      <div key={rsvp.id} className="border-b pb-3 last:border-0">
                        <p className="font-medium">{rsvp.event.title}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(rsvp.event.startDate), "MMM d, yyyy • h:mm a")}</span>
                        </div>
                        {rsvp.event.location && (
                          <p className="text-xs text-muted-foreground mt-1">{rsvp.event.location}</p>
                        )}
                        {rsvp.guestsCount > 0 && (
                          <Badge variant="secondary" className="mt-1">
                            +{rsvp.guestsCount} guests
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Past Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Past Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pastEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground">No past events</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pastEvents.map((rsvp) => (
                      <div key={rsvp.id} className="border-b pb-3 last:border-0">
                        <p className="font-medium">{rsvp.event.title}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(rsvp.event.startDate), "MMM d, yyyy")}</span>
                        </div>
                        <Badge variant="outline" className="mt-1">
                          Attended
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Check-ins Tab */}
        <TabsContent value="checkins" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-primary" />
                Ticket Validations / Check-ins
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ticketValidations.length === 0 ? (
                <div className="text-center py-12">
                  <QrCode className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">No check-ins found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {ticketValidations.map((validation) => (
                    <div key={validation.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                      <div>
                        <p className="font-medium">{validation.purchase.ticket.name}</p>
                        {validation.purchase.ticket.event && (
                          <p className="text-sm text-muted-foreground">
                            {validation.purchase.ticket.event.title}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(validation.validatedAt), "MMM d, yyyy • h:mm a")}</span>
                        </div>
                        {validation.entryPoint && (
                          <p className="text-xs text-muted-foreground">
                            Entry: {validation.entryPoint} | Gate: {validation.gateNumber || "N/A"}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge className="bg-green-100 text-green-800">
                          Validated
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          Ticket: {validation.ticketCode.slice(-8)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}