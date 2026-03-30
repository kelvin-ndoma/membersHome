import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"
import { OrganizationShell } from "./organization-shell"

export default async function OrganizationLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params

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
    },
  })

  if (!membership) {
    redirect("/organization")
  }

  return (
    <OrganizationShell
      orgSlug={orgSlug}
      organization={membership.organization}
      userRole={membership.organizationRole}
    >
      {children}
    </OrganizationShell>
  )
}