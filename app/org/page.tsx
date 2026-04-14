// app/org/page.tsx
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

export default async function OrgPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  // Get user's memberships
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

  if (!user) {
    redirect('/dashboard')
  }

  // Find org admin membership
  const orgMembership = user.memberships.find(
    m => m.role === 'ORG_OWNER' || m.role === 'ORG_ADMIN'
  )

  if (orgMembership) {
    redirect(`/org/${orgMembership.organization.slug}/dashboard`)
  }

  // Find house staff membership
  const houseStaffMembership = user.memberships
    .flatMap(m => m.houseMemberships)
    .find(hm => ['HOUSE_MANAGER', 'HOUSE_ADMIN', 'HOUSE_STAFF'].includes(hm.role))

  if (houseStaffMembership) {
    const org = user.memberships.find(m => 
      m.houseMemberships.some(hm => hm.id === houseStaffMembership.id)
    )?.organization
    
    if (org) {
      redirect(`/org/${org.slug}/dashboard`)
    }
  }

  // Find any house membership for portal redirect
  const houseMember = user.memberships.flatMap(m => m.houseMemberships)[0]
  if (houseMember) {
    redirect(`/portal/${houseMember.house.slug}/dashboard`)
  }

  // Fallback - no memberships
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          No Organizations Found
        </h1>
        <p className="text-gray-600 mb-6">
          You don't have access to any organizations yet. Please contact your administrator.
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