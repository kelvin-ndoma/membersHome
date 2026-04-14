// app/portal/[houseSlug]/layout.tsx
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'
import PortalHeader from '@/components/portal/PortalHeader'
import PortalSidebar from '@/components/portal/PortalSidebar'

export default async function PortalHouseLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { houseSlug: string }
}) {
  const { houseSlug } = await Promise.resolve(params)
  
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  // Find the house through user's memberships
  const userMemberships = await prisma.membership.findMany({
    where: {
      userId: session.user.id,
      status: 'ACTIVE'
    },
    include: {
      organization: {
        select: { slug: true }
      },
      houseMemberships: {
        where: {
          status: 'ACTIVE',
          house: { slug: houseSlug }
        },
        include: { 
          house: {
            include: { organization: true }
          }
        }
      }
    }
  })

  let targetHouse = null
  let targetOrgSlug = ''
  let userRole = 'MEMBER'

  for (const membership of userMemberships) {
    const hm = membership.houseMemberships[0]
    if (hm) {
      targetHouse = hm.house
      targetOrgSlug = hm.house.organization.slug
      userRole = hm.role
      break
    }
  }

  // If not found through memberships, check if org admin
  if (!targetHouse) {
    const orgAdminMemberships = userMemberships.filter(m => 
      m.role === 'ORG_OWNER' || m.role === 'ORG_ADMIN'
    )
    
    for (const membership of orgAdminMemberships) {
      const house = await prisma.house.findFirst({
        where: {
          slug: houseSlug,
          organizationId: membership.organizationId
        },
        include: { organization: true }
      })
      
      if (house) {
        targetHouse = house
        targetOrgSlug = membership.organization.slug
        userRole = 'ORG_ADMIN'
        break
      }
    }
  }

  if (!targetHouse) {
    redirect('/portal/my-houses')
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <PortalHeader 
        houseSlug={houseSlug} 
        orgSlug={targetOrgSlug}
        houseName={targetHouse.name} 
        userRole={userRole} 
      />
      <div className="flex">
        <PortalSidebar houseSlug={houseSlug} />
        <main className="flex-1 lg:pl-64">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}