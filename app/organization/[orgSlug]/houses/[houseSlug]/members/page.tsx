// app/organization/[orgSlug]/houses/[houseSlug]/members/page.tsx
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Input } from "@/components/ui/Input"
import { Users, UserPlus, Search, MoreVertical, Shield, Crown, UserX } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

interface HouseMembersPageProps {
  params: Promise<{ orgSlug: string; houseSlug: string }>
  searchParams: Promise<{ search?: string; role?: string }>
}

export default async function HouseMembersPage({ params, searchParams }: HouseMembersPageProps) {
  const session = await getServerSession(authOptions)
  const { orgSlug, houseSlug } = await params
  const { search = "", role = "" } = await searchParams

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

  // Build where clause for members
  const where: any = {
    houseId: house.id,
    status: "ACTIVE",
  }

  if (search) {
    where.membership = {
      user: {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      },
    }
  }

  if (role) {
    where.role = role
  }

  const houseMembers = await prisma.houseMembership.findMany({
    where,
    include: {
      membership: {
        include: {
          user: true,
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  })

  const roleCounts = await prisma.houseMembership.groupBy({
    by: ["role"],
    where: { houseId: house.id, status: "ACTIVE" },
    _count: true,
  })

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">House Members</h1>
          <p className="text-muted-foreground">Manage members in {house.name}</p>
        </div>
        <Link href={`/organization/${orgSlug}/houses/${houseSlug}/members/invite`}>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        </Link>
      </div>

      {/* Role Stats */}
      <div className="flex flex-wrap gap-4">
        <Link href={`/organization/${orgSlug}/houses/${houseSlug}/members`}>
          <Badge variant={!role ? "default" : "outline"} className="cursor-pointer px-3 py-1">
            All ({houseMembers.length})
          </Badge>
        </Link>
        {roleCounts.map((rc) => (
          <Link key={rc.role} href={`/organization/${orgSlug}/houses/${houseSlug}/members?role=${rc.role}`}>
            <Badge variant={role === rc.role ? "default" : "outline"} className="cursor-pointer px-3 py-1">
              {rc.role.replace("HOUSE_", "")} ({rc._count})
            </Badge>
          </Link>
        ))}
      </div>

      {/* Search */}
      <form method="GET" className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="search"
            placeholder="Search by name or email..."
            defaultValue={search}
            className="pl-9"
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent>
          {houseMembers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No members found</h3>
              <p className="mt-2 text-muted-foreground">
                {search ? "Try a different search term" : "Invite members to join this house"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {houseMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{member.membership.user.name || "Unnamed"}</p>
                      <p className="text-sm text-muted-foreground">{member.membership.user.email}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Joined {format(new Date(member.joinedAt), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getRoleBadge(member.role)}
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
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