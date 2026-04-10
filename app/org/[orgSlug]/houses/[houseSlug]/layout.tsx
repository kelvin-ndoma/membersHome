// app/org/[orgSlug]/houses/[houseSlug]/layout.tsx
import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'
import HouseSidebar from '@/components/org/HouseSidebar'
import HouseHeader from '@/components/org/HouseHeader'

// Force dynamic rendering for all house pages
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface HouseLayoutProps {
  children: React.ReactNode
  params: {
    orgSlug: string
    houseSlug: string
  }
}

export default async function HouseLayout({ children, params }: HouseLayoutProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const house = await prisma.house.findFirst({
    where: {
      slug: params.houseSlug,
      organization: { slug: params.orgSlug }
    },
    include: {
      organization: true,
      members: {
        where: {
          membership: { userId: session.user.id }
        },
        include: {
          membership: true
        }
      }
    }
  })

  if (!house) {
    notFound()
  }

  const userMembership = house.members[0]
  if (!userMembership || userMembership.status !== 'ACTIVE') {
    redirect(`/org/${params.orgSlug}/dashboard`)
  }

  const isHouseAdmin = ['HOUSE_MANAGER', 'HOUSE_ADMIN'].includes(userMembership.role)
  const isOrgAdmin = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
      organizationId: house.organizationId,
      role: { in: ['ORG_OWNER', 'ORG_ADMIN'] }
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <HouseHeader 
        orgSlug={params.orgSlug}
        houseSlug={params.houseSlug}
        houseName={house.name}
        userRole={userMembership.role}
      />
      <div className="flex">
        <HouseSidebar 
          orgSlug={params.orgSlug}
          houseSlug={params.houseSlug}
          isAdmin={!!isHouseAdmin || !!isOrgAdmin}
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