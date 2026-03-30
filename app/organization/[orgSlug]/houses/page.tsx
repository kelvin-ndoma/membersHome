import { Suspense } from "react"
import Link from "next/link"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Badge } from "@/components/ui/Badge"
import { Plus, Home, Users, Calendar, Ticket, Search } from "lucide-react"

interface HousesPageProps {
  params: Promise<{ orgSlug: string }>
  searchParams: Promise<{ search?: string; page?: string }>
}

export default async function HousesPage({ params, searchParams }: HousesPageProps) {
  const session = await getServerSession(authOptions)
  const { orgSlug } = await params
  const { search = "", page = "1" } = await searchParams

  if (!session) {
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

  const pageNum = parseInt(page)
  const pageSize = 12

  const organization = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: { id: true },
  })

  if (!organization) {
    redirect("/organization")
  }

  const where: any = {
    organizationId: organization.id,
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
    ]
  }

  const [houses, total] = await Promise.all([
    prisma.house.findMany({
      where,
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            members: true,
            events: true,
            tickets: true,
          },
        },
      },
    }),
    prisma.house.count({ where }),
  ])

  const totalPages = Math.ceil(total / pageSize)

  const canCreate = membership.organizationRole === "ORG_ADMIN" || membership.organizationRole === "ORG_OWNER"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Houses</h1>
          <p className="text-muted-foreground">Manage your organization's houses and sub-groups</p>
        </div>
        {canCreate && (
          <Link href={`/organization/${orgSlug}/houses/create`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create House
            </Button>
          </Link>
        )}
      </div>

      <div className="flex gap-2">
        <form method="GET" className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="search"
              placeholder="Search houses..."
              defaultValue={search}
              className="pl-9"
            />
          </div>
        </form>
      </div>

      {houses.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Home className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No houses yet</h3>
            <p className="mt-2 text-muted-foreground">
              {canCreate 
                ? "Create your first house to organize your members into sub-groups."
                : "No houses have been created yet."}
            </p>
            {canCreate && (
              <Link href={`/organization/${orgSlug}/houses/create`}>
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Create House
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {houses.map((house) => (
              <Link key={house.id} href={`/organization/${orgSlug}/houses/${house.slug}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Home className="h-5 w-5 text-primary" />
                        <CardTitle className="text-xl">{house.name}</CardTitle>
                      </div>
                      {house.isPrivate && (
                        <Badge variant="outline">Private</Badge>
                      )}
                    </div>
                    {house.description && (
                      <CardDescription className="line-clamp-2">
                        {house.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{house._count.members} members</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{house._count.events} events</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Ticket className="h-4 w-4 text-muted-foreground" />
                        <span>{house._count.tickets} tickets</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">
                      View House
                    </Button>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={`?page=${p}&search=${search}`}
                  className={`px-3 py-1 rounded ${
                    p === pageNum
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {p}
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}