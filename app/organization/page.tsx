import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Building2, Users, Home, Calendar, ArrowRight } from "lucide-react"
import Link from "next/link"

export default async function OrganizationHomePage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/auth/login")
  }

  const memberships = await prisma.membership.findMany({
    where: {
      userId: session.user.id,
      status: "ACTIVE",
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          description: true,
          _count: {
            select: {
              memberships: true,
              houses: true,
              events: true,
            },
          },
        },
      },
      houseMemberships: {
        where: { status: "ACTIVE" },
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
    orderBy: { joinedAt: "desc" },
  })

  const hasOrganizations = memberships.length > 0

  return (
    <div className="container mx-auto max-w-6xl py-12 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Your Organizations</h1>
        <p className="mt-2 text-muted-foreground">
          Select an organization to manage or create a new one
        </p>
      </div>

      {!hasOrganizations ? (
        <Card className="mx-auto max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>No organizations yet</CardTitle>
            <CardDescription>
              You haven't joined or created any organizations. Get started by creating your first organization.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Link href="/organization/create">
              <Button>
                Create Organization
              </Button>
            </Link>
          </CardFooter>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {memberships.map((membership) => (
            <Card key={membership.organization.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  {membership.organization.logoUrl ? (
                    <img
                      src={membership.organization.logoUrl}
                      alt={membership.organization.name}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-xl">{membership.organization.name}</CardTitle>
                    <CardDescription>
                      {membership.organizationRole === "ORG_OWNER" ? "Owner" : 
                       membership.organizationRole === "ORG_ADMIN" ? "Admin" : "Member"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {membership.organization.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {membership.organization.description}
                  </p>
                )}
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{membership.organization._count.memberships} members</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Home className="h-4 w-4 text-muted-foreground" />
                    <span>{membership.organization._count.houses} houses</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{membership.organization._count.events} events</span>
                  </div>
                </div>
                {membership.houseMemberships.length > 0 && (
                  <div className="border-t pt-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Your Houses:</p>
                    <div className="flex flex-wrap gap-1">
                      {membership.houseMemberships.map((hm) => (
                        <span key={hm.house.id} className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs">
                          {hm.house.name}
                          <span className="ml-1 text-muted-foreground">({hm.role.split("_")[1]})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Link href={`/organization/${membership.organization.slug}/dashboard`} className="w-full">
                  <Button className="w-full" variant="outline">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}