// app/portal/[orgSlug]/profile/page.tsx
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"
import { ProfileForm } from "./ProfileForm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { User, Mail, Phone, Building2, Calendar, Home } from "lucide-react"
import { format } from "date-fns"

interface ProfilePageProps {
  params: Promise<{ orgSlug: string }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const session = await getServerSession(authOptions)
  const { orgSlug } = await params

  if (!session?.user?.id) {
    redirect(`/auth/login?callbackUrl=/portal/${orgSlug}/profile`)
  }

  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
      organization: { slug: orgSlug },
      status: "ACTIVE",
    },
    include: {
      organization: true,
      houseMemberships: {
        where: { status: "ACTIVE" },
        include: {
          house: true,
        },
      },
      user: true,
    },
  })

  if (!membership) {
    redirect(`/organization/${orgSlug}`)
  }

  const user = membership.user
  const houses = membership.houseMemberships.map(hm => hm.house)

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">Manage your personal information and account settings</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Info Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm
              user={{
                id: user.id,
                name: user.name || "",
                email: user.email,
                phone: user.phone || "",
              }}
              orgSlug={orgSlug}
            />
          </CardContent>
        </Card>

        {/* Membership Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Membership Info</CardTitle>
            <CardDescription>Your membership details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium capitalize">{membership.status.toLowerCase()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Member since:</span>
                <span className="font-medium">{format(new Date(membership.joinedAt), "MMM d, yyyy")}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Organization:</span>
                <span className="font-medium">{membership.organization.name}</span>
              </div>
            </div>

            {houses.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-sm font-medium mb-2">My Houses</p>
                <div className="space-y-2">
                  {houses.map((house) => (
                    <div key={house.id} className="flex items-center gap-2 text-sm">
                      <Home className="h-3 w-3 text-primary" />
                      <span>{house.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}