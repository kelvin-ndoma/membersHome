// app/organization/[orgSlug]/houses/[houseSlug]/tickets/[ticketId]/page.tsx
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
  Ticket, 
  Calendar, 
  DollarSign, 
  Users, 
  Eye, 
  Edit, 
  ArrowLeft,
  Clock,
  ShoppingCart,
  CheckCircle,
  XCircle
} from "lucide-react"
import { format } from "date-fns"

interface TicketDetailPageProps {
  params: Promise<{ orgSlug: string; houseSlug: string; ticketId: string }>
}

export default async function TicketDetailPage({ params }: TicketDetailPageProps) {
  const session = await getServerSession(authOptions)
  const { orgSlug, houseSlug, ticketId } = await params

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

  const ticket = await prisma.ticket.findFirst({
    where: {
      id: ticketId,
      houseId: house.id,
      organizationId: organization.id,
    },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          startDate: true,
          endDate: true,
          location: true,
        },
      },
      _count: {
        select: {
          purchases: true,
          validations: true,
        },
      },
    },
  })

  if (!ticket) {
    notFound()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case "DRAFT":
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>
      case "SOLD_OUT":
        return <Badge className="bg-red-100 text-red-800">Sold Out</Badge>
      case "EXPIRED":
        return <Badge className="bg-yellow-100 text-yellow-800">Expired</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getTicketTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      GENERAL_ADMISSION: "General Admission",
      VIP: "VIP",
      EARLY_BIRD: "Early Bird",
      GROUP: "Group",
      SEASON_PASS: "Season Pass",
      WORKSHOP: "Workshop",
      COURSE: "Course",
      DONATION: "Donation",
      CUSTOM: "Custom"
    }
    return map[type] || type
  }

  const getSalesStatus = () => {
    const now = new Date()
    if (now < ticket.salesStartAt) return "Not Started"
    if (now > ticket.salesEndAt) return "Ended"
    return "Active"
  }

  const getSalesStatusColor = () => {
    const status = getSalesStatus()
    switch (status) {
      case "Not Started":
        return "text-yellow-600"
      case "Ended":
        return "text-red-600"
      default:
        return "text-green-600"
    }
  }

  const availableQuantity = ticket.totalQuantity - ticket.soldQuantity - ticket.reservedQuantity
  const soldPercentage = (ticket.soldQuantity / ticket.totalQuantity) * 100

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/organization/${orgSlug}/houses/${houseSlug}/tickets`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{ticket.name}</h1>
              {getStatusBadge(ticket.status)}
            </div>
            <p className="text-muted-foreground">
              {getTicketTypeLabel(ticket.type)} • {house.name}
            </p>
          </div>
        </div>
        <Link href={`/organization/${orgSlug}/houses/${houseSlug}/tickets/${ticketId}/edit`}>
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Edit Ticket
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
                {ticket.price === 0 ? "Free" : `${ticket.currency} ${ticket.price}`}
              </p>
              {ticket.price > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  per ticket
                </p>
              )}
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Revenue</span>
                <span className="font-semibold">
                  {ticket.currency} {(ticket.price * ticket.soldQuantity).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Potential Revenue</span>
                <span className="font-semibold">
                  {ticket.currency} {(ticket.price * ticket.totalQuantity).toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              Inventory
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Sold: {ticket.soldQuantity}</span>
                <span>Remaining: {availableQuantity}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${soldPercentage}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Total: {ticket.totalQuantity} tickets
              </p>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Max Per Purchase</span>
                <span className="font-semibold">{ticket.maxPerPurchase}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reserved</span>
                <span className="font-semibold">{ticket.reservedQuantity}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sales Period Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Sales Period
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Sales Start</p>
                <p className="font-medium">{format(new Date(ticket.salesStartAt), "MMM d, yyyy • h:mm a")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sales End</p>
                <p className="font-medium">{format(new Date(ticket.salesEndAt), "MMM d, yyyy • h:mm a")}</p>
              </div>
              <div className="pt-2">
                <p className="text-sm text-muted-foreground">Status</p>
                <p className={`font-semibold ${getSalesStatusColor()}`}>{getSalesStatus()}</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Valid From</p>
                <p className="font-medium">{format(new Date(ticket.validFrom), "MMM d, yyyy")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valid Until</p>
                <p className="font-medium">{format(new Date(ticket.validUntil), "MMM d, yyyy")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Info if linked */}
      {ticket.event && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Linked Event
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{ticket.event.title}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(ticket.event.startDate), "MMM d, yyyy • h:mm a")}
                </p>
                {ticket.event.location && (
                  <p className="text-sm text-muted-foreground mt-1">{ticket.event.location}</p>
                )}
              </div>
              <Link href={`/organization/${orgSlug}/houses/${houseSlug}/events/${ticket.event.id}`}>
                <Button variant="outline" size="sm">
                  View Event
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ticket Description */}
      {ticket.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{ticket.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Stats Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Purchases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{ticket._count.purchases}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Total purchases made
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Validations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{ticket._count.validations}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tickets validated at events
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Settings Section */}
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Members Only</span>
            <Badge variant={ticket.memberOnly ? "default" : "outline"}>
              {ticket.memberOnly ? "Yes" : "No"}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Requires Approval</span>
            <Badge variant={ticket.requiresApproval ? "default" : "outline"}>
              {ticket.requiresApproval ? "Yes" : "No"}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Refundable</span>
            <Badge variant={ticket.isRefundable ? "default" : "outline"}>
              {ticket.isRefundable ? "Yes" : "No"}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Public</span>
            <Badge variant={ticket.isPublic ? "default" : "outline"}>
              {ticket.isPublic ? "Yes" : "No"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Link href={`/organization/${orgSlug}/houses/${houseSlug}/tickets/${ticketId}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit Ticket
            </Button>
          </Link>
          <Link href={`/organization/${orgSlug}/houses/${houseSlug}/tickets/${ticketId}/purchases`}>
            <Button variant="outline">
              <ShoppingCart className="mr-2 h-4 w-4" />
              View Purchases
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}