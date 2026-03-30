import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/db"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { User, Mail, Phone, Calendar, Building2, Ticket, DollarSign, Shield } from "lucide-react"
import { format } from "date-fns"

interface UserPageProps {
  params: Promise<{ userId: string }>
}

export default async function UserDetailPage({ params }: UserPageProps) {
  const { userId } = await params

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      phone: true,
      platformRole: true,
      emailVerified: true,
      mfaEnabled: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      memberships: {
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
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
        },
      },
      ticketPurchases: {
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          ticket: {
            select: {
              name: true,
              type: true,
            },
          },
          organization: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      },
      payments: {
        take: 5,
        orderBy: { createdAt: "desc" },
        where: { status: "SUCCEEDED" },
      },
      _count: {
        select: {
          memberships: true,
          ticketPurchases: true,
          payments: true,
          createdEvents: true,
        },
      },
    },
  })

  if (!user) {
    notFound()
  }

  const totalSpent = user.payments.reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {user.image ? (
            <img src={user.image} alt={user.name || ""} className="h-16 w-16 rounded-full" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <User className="h-8 w-8 text-primary" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{user.name || "Unnamed User"}</h1>
            <p className="text-muted-foreground">{user.email}</p>
            {user.phone && <p className="text-sm text-muted-foreground">{user.phone}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled>
            Edit User
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Role</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {user.platformRole === "PLATFORM_ADMIN" ? "Admin" : "User"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user._count.memberships}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user._count.ticketPurchases}</div>
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

      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Email Verified</p>
              <p className="font-medium">
                {user.emailVerified ? format(new Date(user.emailVerified), "MMM d, yyyy") : "No"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">MFA Enabled</p>
              <p className="font-medium">{user.mfaEnabled ? "Yes" : "No"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Login</p>
              <p className="font-medium">
                {user.lastLoginAt ? format(new Date(user.lastLoginAt), "MMM d, yyyy h:mm a") : "Never"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Joined</p>
              <p className="font-medium">{format(new Date(user.createdAt), "MMM d, yyyy")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Organizations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {user.memberships.map((membership) => (
                <div key={membership.id} className="border-b pb-3 last:border-0">
                  <div className="flex items-center justify-between">
                    <Link href={`/admin/organizations/${membership.organization.id}`} className="font-medium text-primary hover:underline">
                      {membership.organization.name}
                    </Link>
                    <span className="text-sm text-muted-foreground">{membership.organizationRole}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Status: {membership.status}</p>
                  {membership.houseMemberships.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground">Houses:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {membership.houseMemberships.map((hm) => (
                          <span key={hm.id} className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs">
                            {hm.house.name} ({hm.role})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {user.memberships.length === 0 && (
                <p className="text-center text-muted-foreground">No organizations</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {user.ticketPurchases.map((purchase) => (
                <div key={purchase.id} className="border-b pb-3 last:border-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{purchase.ticket.name}</p>
                      <p className="text-sm text-muted-foreground">{purchase.organization.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{purchase.quantity} tickets</p>
                      <p className="text-sm">${purchase.totalAmount}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Purchased {format(new Date(purchase.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
              ))}
              {user.ticketPurchases.length === 0 && (
                <p className="text-center text-muted-foreground">No ticket purchases</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}