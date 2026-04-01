// app/organization/[orgSlug]/houses/[houseSlug]/tickets/page.tsx
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Ticket, Plus, Calendar, DollarSign, Users, Eye, Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

interface HouseTicketsPageProps {
  params: Promise<{ orgSlug: string; houseSlug: string }>
}

export default async function HouseTicketsPage({ params }: HouseTicketsPageProps) {
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

  const tickets = await prisma.ticket.findMany({
    where: {
      houseId: house.id,
      organizationId: organization.id,
    },
    include: {
      event: {
        select: { id: true, title: true, startDate: true },
      },
      _count: {
        select: { purchases: true, validations: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

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
      GENERAL_ADMISSION: "General",
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tickets</h1>
          <p className="text-muted-foreground">
            Manage tickets for {house.name}
          </p>
        </div>
        <Link href={`/organization/${orgSlug}/houses/${houseSlug}/tickets/create`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Ticket
          </Button>
        </Link>
      </div>

      {tickets.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Ticket className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No tickets yet</h3>
            <p className="mt-2 text-muted-foreground">
              Create your first ticket for {house.name}
            </p>
            <Link href={`/organization/${orgSlug}/houses/${houseSlug}/tickets/create`}>
              <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Create Ticket
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tickets.map((ticket) => (
            <Card key={ticket.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{ticket.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getTicketTypeLabel(ticket.type)}
                    </p>
                  </div>
                  {getStatusBadge(ticket.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {ticket.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{ticket.description}</p>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Price</span>
                    <span className="font-semibold">
                      {ticket.price === 0 ? "Free" : `${ticket.currency} ${ticket.price}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sales</span>
                    <span>{ticket.soldQuantity} / {ticket.totalQuantity} sold</span>
                  </div>
                  {ticket.event && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
                      <Calendar className="h-4 w-4" />
                      <span>{ticket.event.title}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Link href={`/organization/${orgSlug}/houses/${houseSlug}/tickets/${ticket.id}`} className="flex-1">
                    <Button variant="outline" className="w-full" size="sm">
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                  </Link>
                  <Link href={`/organization/${orgSlug}/houses/${houseSlug}/tickets/${ticket.id}/edit`} className="flex-1">
                    <Button className="w-full" size="sm">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </Link>
                </div>

                <div className="text-xs text-muted-foreground text-center pt-2">
                  {ticket._count.purchases} purchases • {ticket._count.validations} validations
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}