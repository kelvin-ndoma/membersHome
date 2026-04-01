// app/organization/[orgSlug]/layout.tsx
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"
import { OrganizationShell } from "./organization-shell"

interface House {
  id: string
  name: string
  slug: string
}

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ orgSlug: string }>
  searchParams?: Promise<{ houseId?: string }>
}

export default async function OrganizationLayout({
  children,
  params,
  searchParams,
}: LayoutProps) {
  const { orgSlug } = await params
  
  let houseId: string | undefined
  if (searchParams) {
    const sp = await searchParams
    houseId = sp?.houseId
  }

  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect(
      `/auth/login?callbackUrl=${encodeURIComponent(
        `/organization/${orgSlug}/dashboard`
      )}`
    )
  }

  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
      status: "ACTIVE",
      organization: {
        slug: orgSlug,
      },
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
        },
      },
      houseMemberships: {
        include: {
          house: true,
        },
      },
    },
  })

  if (!membership) {
    redirect("/organization")
  }

  // Check if user is organization admin or owner
  const isOrgAdmin = membership.organizationRole === "ORG_ADMIN" || 
                     membership.organizationRole === "ORG_OWNER"

  // Regular members should NOT access the organization dashboard
  if (!isOrgAdmin) {
    redirect(`/portal/${orgSlug}/dashboard`)
  }

  // Get all houses for this organization
  const allHouses: House[] = await prisma.house.findMany({
    where: { organizationId: membership.organization.id },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  })

  // Determine selected house from URL or first house
  let selectedHouse: House | null = null
  if (houseId) {
    const found = allHouses.find((h) => h.id === houseId)
    if (found) {
      selectedHouse = found
    }
  }

  return (
    <OrganizationShell
      orgSlug={orgSlug}
      organization={membership.organization}
      userRole={membership.organizationRole}
      allHouses={allHouses}
      selectedHouse={selectedHouse}
      isAdmin={isOrgAdmin}
    >
      {children}
    </OrganizationShell>
  )
}