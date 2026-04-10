// app/org/[orgSlug]/layout.tsx
import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'
import OrgSidebar from '@/components/org/OrgSidebar'
import OrgHeader from '@/components/org/OrgHeader'

// Force dynamic rendering for all org pages
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface OrgLayoutProps {
  children: React.ReactNode
  params: {
    orgSlug: string
  }
}

export default async function OrgSlugLayout({ children, params }: OrgLayoutProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  // Get the current path
  const headersList = headers()
  const pathname = headersList.get('x-pathname') || ''
  
  // Check if this is a house detail page (not the houses list page)
  const pathParts = pathname.split('/')
  const isHousesListPage = pathname === `/org/${params.orgSlug}/houses` || 
                           pathname === `/org/${params.orgSlug}/houses/`
  const isHouseDetailPage = pathParts.length >= 5 && 
                            pathParts[3] === 'houses' && 
                            pathParts[4] !== '' &&
                            !isHousesListPage

  const organization = await prisma.organization.findUnique({
    where: { slug: params.orgSlug },
    include: {
      memberships: {
        where: { userId: session.user.id },
        select: {
          role: true,
          status: true,
        }
      }
    }
  })

  if (!organization) {
    notFound()
  }

  const userMembership = organization.memberships[0]
  if (!userMembership || userMembership.status !== 'ACTIVE') {
    redirect('/dashboard')
  }

  const isAdmin = ['ORG_OWNER', 'ORG_ADMIN'].includes(userMembership.role)

  // If it's a house detail page, render just the children (house layout will handle header/sidebar)
  if (isHouseDetailPage) {
    return <>{children}</>
  }

  // Otherwise (org dashboard, houses list, reports, settings), render with org header and sidebar
  return (
    <div className="min-h-screen bg-gray-50">
      <OrgHeader orgSlug={params.orgSlug} orgName={organization.name} userRole={userMembership.role} />
      <div className="flex">
        <OrgSidebar orgSlug={params.orgSlug} isAdmin={isAdmin} />
        <main className="flex-1 lg:pl-64">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}