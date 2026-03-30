import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/db"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Ticket, Building2, Calendar, Users, DollarSign, Clock, Eye } from "lucide-react"
import { format } from "date-fns"

interface TicketPageProps {
  params: Promise<{ ticketId: string }>
}

export default async function TicketDetailPage({ params }: TicketPageProps) {
  const { ticketId } = await params

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
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
      event: {
        select: {
          id: true,
          title: true,
          startDate: true,
          endDate: true,
          location: true,
        },
      },
      purchases: {
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          membership: {
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
          validations: true,
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

  const totalRevenue = ticket.purchases.reduce((sum, p) => sum + p.totalAmount, 0)
  const availableQuantity = ticket.totalQuantity - ticket.soldQuantity - ticket.reservedQuantity

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: "bg-gray-100 text-gray-800",
      ACTIVE: "bg-green-100 text-green-800",
      SOLD_OUT: "bg-yellow-100 text-yellow-800",
      CANCELLED: "bg-red-100 text-red-800",
      EXPIRED: "bg-gray-100 text-gray-800",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Ticket className="h-8 w-8 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{ticket.name}</h1>
            <p className="text-muted-foreground">
              {ticket.organization.name} {ticket.house && `• ${ticket.house.name}`}
            </p>
          </div>
        </div>
        <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${getStatusBadge(ticket.status)}`}>
          {ticket.status}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ticket.currency} {ticket.price}</div>
            {ticket.memberPrice && (
              <p className="text-xs text-muted-foreground">Member: {ticket.memberPrice}</p>
            )}
            {ticket.earlyBirdPrice && (
              <p className="text-xs text-muted-foreground">Early Bird: {ticket.earlyBirdPrice}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ticket.soldQuantity} / {ticket.totalQuantity}</div>
            <p className="text-xs text-muted-foreground">
              Available: {availableQuantity} • Reserved: {ticket.reservedQuantity}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{ticket._count.purchases} purchases</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Validations</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ticket._count.validations}</div>
            <p className="text-xs text-muted-foreground">Total scans</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ticket Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-medium">{ticket.type.replace("_", " ")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Max Per Purchase</p>
                <p className="font-medium">{ticket.maxPerPurchase}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Members Only</p>
                <p className="font-medium">{ticket.memberOnly ? "Yes" : "No"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Refundable</p>
                <p className="font-medium">{ticket.isRefundable ? "Yes" : "No"}</p>
              </div>
            </div>
            {ticket.description && (
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="mt-1 text-sm">{ticket.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Validity Period</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Sales Period</p>
              <p className="font-medium">
                {format(new Date(ticket.salesStartAt), "MMM d, yyyy h:mm a")} - {format(new Date(ticket.salesEndAt), "MMM d, yyyy h:mm a")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valid Period</p>
              <p className="font-medium">
                {format(new Date(ticket.validFrom), "MMM d, yyyy h:mm a")} - {format(new Date(ticket.validUntil), "MMM d, yyyy h:mm a")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {ticket.event && (
        <Card>
          <CardHeader>
            <CardTitle>Associated Event</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <Link href={`/admin/events/${ticket.event.id}`} className="text-lg font-medium text-primary hover:underline">
                  {ticket.event.title}
                </Link>
                <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(ticket.event.startDate), "MMM d, yyyy h:mm a")}
                  </div>
                  {ticket.event.location && (
                    <div className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {ticket.event.location}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Purchases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ticket.purchases.map((purchase) => (
              <div key={purchase.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                <div>
                  <p className="font-medium">
                    {purchase.membership?.user.name || purchase.customerName || "Guest"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {purchase.membership?.user.email || purchase.customerEmail}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {purchase.quantity} tickets • {purchase.usedCount} used
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{purchase.currency} {purchase.totalAmount}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(purchase.createdAt), "MMM d, yyyy")}
                  </p>
                  <p className="text-xs text-muted-foreground">{purchase.paymentStatus}</p>
                </div>
              </div>
            ))}
            {ticket.purchases.length === 0 && (
              <p className="text-center text-muted-foreground">No purchases yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}