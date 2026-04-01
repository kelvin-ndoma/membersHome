// app/portal/[orgSlug]/announcements/page.tsx
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"
import { AnnouncementsList } from "./AnnouncementsList"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Bell } from "lucide-react"

interface AnnouncementsPageProps {
  params: Promise<{ orgSlug: string }>
  searchParams: Promise<{ houseId?: string }>
}

export default async function AnnouncementsPage({ params, searchParams }: AnnouncementsPageProps) {
  const session = await getServerSession(authOptions)
  const { orgSlug } = await params
  const { houseId } = await searchParams

  if (!session?.user?.id) {
    redirect(`/auth/login?callbackUrl=/portal/${orgSlug}/announcements`)
  }

  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
      organization: { slug: orgSlug },
      status: "ACTIVE",
    },
    include: {
      houseMemberships: {
        where: { status: "ACTIVE" },
        include: { house: true },
      },
    },
  })

  if (!membership) {
    redirect(`/organization/${orgSlug}`)
  }

  const houses = membership.houseMemberships.map(hm => hm.house)
  const houseIds = houses.map(h => h.id)

  // Build where clause for announcements
  let whereClause: any = {
    organizationId: membership.organizationId,
    status: "SENT",
    type: "ANNOUNCEMENT",
  }

  if (houseId) {
    whereClause.houseId = houseId
  } else if (houses.length > 0) {
    whereClause.OR = [
      { houseId: { in: houseIds } },
      { houseId: null },
    ]
  }

  const announcements = await prisma.communication.findMany({
    where: whereClause,
    orderBy: { sentAt: "desc" },
  })

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
        <p className="text-muted-foreground">Stay updated with the latest news</p>
      </div>

      {announcements.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No announcements yet</h3>
            <p className="mt-2 text-muted-foreground">
              Check back later for updates
            </p>
          </CardContent>
        </Card>
      ) : (
        <AnnouncementsList announcements={announcements} houses={houses} />
      )}
    </div>
  )
}