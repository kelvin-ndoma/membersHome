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

  // Get user with memberships to determine redirect
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      memberships: {
        where: { status: 'ACTIVE' },
        include: {
          organization: true,
          houseMemberships: {
            where: { status: 'ACTIVE' },
            include: { house: true }
          }
        }
      }
    }
  })

  // Platform Admin -> Platform Dashboard
  if (user?.platformRole === 'PLATFORM_ADMIN') {
    redirect('/platform/dashboard')
  }

  // Organization Owner/Admin -> Organization Dashboard
  const orgMembership = user?.memberships.find(
    m => m.role === 'ORG_OWNER' || m.role === 'ORG_ADMIN'
  )
  
  if (orgMembership) {
    redirect(`/org/${orgMembership.organization.slug}/dashboard`)
  }

  // House Manager/Staff -> House Dashboard
  const houseMembership = user?.memberships.flatMap(m => m.houseMemberships).find(
    hm => hm.role === 'HOUSE_MANAGER' || hm.role === 'HOUSE_ADMIN' || hm.role === 'HOUSE_STAFF'
  )

  if (houseMembership) {
    redirect(`/portal/${houseMembership.house.slug}/dashboard`)
  }

  // Regular Member -> Member Portal (first house)
  const firstHouse = user?.memberships.flatMap(m => m.houseMemberships)[0]
  
  if (firstHouse) {
    redirect(`/portal/${firstHouse.house.slug}/dashboard`)
  }

  // Fallback - User with no memberships
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
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