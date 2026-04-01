import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"
import { MemberPortalShell } from "@/components/portal/MemberPortalShell"

export default async function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ orgSlug: string }>
}) {
  const session = await getServerSession(authOptions)
  const { orgSlug } = await params

  if (!session?.user?.id) {
    redirect(`/auth/login?callbackUrl=/portal/${orgSlug}/dashboard`)
  }

  // Check if user is a member (has ACTIVE membership)
  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
      organization: { slug: orgSlug },
      status: "ACTIVE",
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          primaryColor: true,
        },
      },
    },
  })

  if (!membership) {
    // Not a member, redirect to public organization page
    redirect(`/organization/${orgSlug}`)
  }

  // Get member's active membership item (if they have a paid subscription)
  const membershipItem = await prisma.membershipItem.findFirst({
    where: {
      userId: session.user.id,
      organizationId: membership.organizationId,
      status: "ACTIVE",
    },
    include: {
      membershipPlan: true,
    },
  })

  return (
    <MemberPortalShell
      organization={membership.organization}
      membership={membership}
      membershipItem={membershipItem}
    >
      {children}
    </MemberPortalShell>
  )
}