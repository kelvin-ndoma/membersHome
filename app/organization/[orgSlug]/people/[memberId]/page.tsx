import { notFound } from "next/navigation"
import Link from "next/link"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar"
import { Badge } from "@/components/ui/Badge"
import { Mail, Phone, Calendar, Edit, User, Home, Ticket, DollarSign } from "lucide-react"
import { format } from "date-fns"

interface MemberPageProps {
  params: Promise<{ orgSlug: string; memberId: string }>
}

export default async function MemberDetailPage({ params }: MemberPageProps) {
  const session = await getServerSession(authOptions)
  const { orgSlug, memberId } = await params

  if (!session) {
    redirect("/auth/login")
  }

  const membership = await prisma.membership.findFirst({
    where: {
      id: memberId,
      organization: { slug: orgSlug },
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
      houseMemberships: {
        include: {
          house: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
      invoices: {
        take: 5,
        orderBy: { createdAt: "desc" },
      },
      ticketPurchases: {
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          ticket: true,
        },
      },
      rsvps: {
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          event: true,
        },
      },
    },
  })

  if (!membership) {
    notFound()
  }

  const getInitials = (name: string | null) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const totalSpent = membership.ticketPurchases.reduce(
    (sum, p) => sum + p.totalAmount,
    0
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={membership.user.image || ""} />
            <AvatarFallback className="text-lg">
              {getInitials(membership.user.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{membership.user.name || "Unnamed"}</h1>
            <p className="text-muted-foreground">{membership.user.email}</p>
            <div className="mt-1 flex gap-2">
              <Badge variant="outline">{membership.organizationRole}</Badge>
              <Badge variant="secondary">{membership.status}</Badge>
            </div>
          </div>
        </div>
        <Link href={`/organization/${orgSlug}/people/${memberId}/edit`}>
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Joined</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {format(new Date(membership.joinedAt), "MMM d, yyyy")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Houses</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{membership.houseMemberships.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSpent.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{membership.user.email}</span>
            </div>
            {membership.user.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{membership.user.phone}</span>
              </div>
            )}
            {membership.title && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{membership.title}</span>
              </div>
            )}
            {membership.bio && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">Bio</p>
                <p className="mt-1">{membership.bio}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>House Memberships</CardTitle>
          </CardHeader>
          <CardContent>
            {membership.houseMemberships.length === 0 ? (
              <p className="text-center text-muted-foreground">No house memberships</p>
            ) : (
              <div className="space-y-3">
                {membership.houseMemberships.map((hm) => (
                  <div key={hm.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div>
                      <p className="font-medium">{hm.house.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Joined {format(new Date(hm.joinedAt), "MMM d, yyyy")}
                      </p>
                    </div>
                    <Badge variant="outline">{hm.role}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {membership.ticketPurchases.length === 0 ? (
            <p className="text-center text-muted-foreground">No ticket purchases</p>
          ) : (
            <div className="space-y-3">
              {membership.ticketPurchases.map((purchase) => (
                <div key={purchase.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium">{purchase.ticket.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {purchase.quantity} tickets • {format(new Date(purchase.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{purchase.currency} {purchase.totalAmount}</p>
                    <p className="text-xs text-muted-foreground">{purchase.paymentStatus}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}