// app/org/[orgSlug]/layout.tsx
import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'
import OrgLayoutWrapper from '@/components/org/OrgLayoutWrapper'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface OrgLayoutProps {
  children: React.ReactNode
  params: {
    orgSlug: string
  }
}

export default async function OrgSlugLayout({ children, params }: OrgLayoutProps) {
  const { orgSlug } = await Promise.resolve(params)
  
  if (!orgSlug) {
    redirect('/dashboard')
  }

  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const organization = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    include: {
      memberships: {
        where: { 
          userId: session.user.id,
          status: 'ACTIVE'
        },
        include: {
          houseMemberships: {
            where: { status: 'ACTIVE' },
            include: { house: true }
          }
        }
      }
    }
  })

  if (!organization) {
    notFound()
  }

  const userMembership = organization.memberships[0]
  
  if (!userMembership) {
    redirect('/dashboard')
  }
  
  const isOrgAdmin = userMembership.role === 'ORG_OWNER' || userMembership.role === 'ORG_ADMIN'
  const isHouseStaff = userMembership.houseMemberships.some(
    hm => ['HOUSE_MANAGER', 'HOUSE_ADMIN', 'HOUSE_STAFF'].includes(hm.role)
  )

  if (!isOrgAdmin && !isHouseStaff) {
    redirect('/dashboard')
  }

  const isAdmin = isOrgAdmin

  return (
    <OrgLayoutWrapper 
      orgSlug={orgSlug}
      orgName={organization.name}
      userRole={userMembership.role}
      isAdmin={isAdmin}
    >
      {children}
    </OrgLayoutWrapper>
  )
}