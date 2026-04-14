// app/dashboard/page.tsx
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      memberships: {
        where: { status: 'ACTIVE' },
        include: {
          organization: true,
          houseMemberships: {
            where: { status: 'ACTIVE' },
            include: { 
              house: {
                include: {
                  organization: true
                }
              }
            }
          }
        }
      }
    }
  })

  if (!user) {
    redirect('/login')
  }

  // 1. Platform Admin -> Platform Dashboard
  if (user.platformRole === 'PLATFORM_ADMIN') {
    redirect('/platform/dashboard')
  }

  // 2. Check if user has any house membership
  const houseMemberships = user.memberships.flatMap(m => m.houseMemberships)
  
  // 3. Check if user is org admin/owner
  const orgAdminMembership = user.memberships.find(
    m => m.role === 'ORG_OWNER' || m.role === 'ORG_ADMIN'
  )

  // 4. Check if user is house manager/admin/staff (can access org)
  const canAccessOrg = houseMemberships.some(
    hm => ['HOUSE_MANAGER', 'HOUSE_ADMIN', 'HOUSE_STAFF'].includes(hm.role)
  )

  // 5. Determine redirect based on role
  if (orgAdminMembership) {
    // Org owners/admins go to org dashboard
    redirect(`/org/${orgAdminMembership.organization.slug}/dashboard`)
  }

  if (canAccessOrg) {
    // House managers/admins/staff go to org dashboard (first house's org)
    const primaryHouseMembership = houseMemberships.find(
      hm => ['HOUSE_MANAGER', 'HOUSE_ADMIN', 'HOUSE_STAFF'].includes(hm.role)
    )
    if (primaryHouseMembership) {
      const org = primaryHouseMembership.house.organization
      redirect(`/org/${org.slug}/dashboard`)
    }
  }

  if (houseMemberships.length > 0) {
    // Regular members go directly to portal
    const primaryHouse = houseMemberships[0].house
    redirect(`/portal/${primaryHouse.slug}/dashboard`)
  }

  // Fallback - no memberships
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Welcome to MembersHome!
        </h1>
        <p className="text-gray-600 mb-6">
          You don't have any memberships yet. Please contact your organization administrator.
        </p>
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="text-blue-600 hover:text-blue-700"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  )
}