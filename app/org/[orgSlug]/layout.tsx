// app/org/[orgSlug]/layout.tsx
import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'
import OrgSidebar from '@/components/org/OrgSidebar'
import OrgHeader from '@/components/org/OrgHeader'

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

  // Get the current path from headers
  const headersList = headers()
  const pathname = headersList.get('x-pathname') || ''
  
  // Check if this is a house detail page (inside a specific house)
  // Pattern: /org/[orgSlug]/houses/[houseSlug]/...
  const pathParts = pathname.split('/').filter(Boolean)
  
  // pathParts should be like: ['org', 'hq-kenya-house', 'houses', 'main', 'dashboard']
  const isHouseDetailPage = pathParts.length >= 4 && 
                            pathParts[0] === 'org' &&
                            pathParts[2] === 'houses'
  
  console.log('Pathname:', pathname)
  console.log('Is house detail page?', isHouseDetailPage)

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

  // IMPORTANT: If it's a house detail page, render children WITHOUT org header/sidebar
  if (isHouseDetailPage) {
    return <>{children}</>
  }

  const isAdmin = isOrgAdmin

  return (
    <div className="min-h-screen bg-gray-50">
      <OrgHeader 
        orgSlug={orgSlug} 
        orgName={organization.name} 
        userRole={userMembership.role} 
      />
      <div className="flex">
        <OrgSidebar 
          orgSlug={orgSlug} 
          isAdmin={isAdmin}
        />
        <main className="flex-1 lg:pl-64">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}