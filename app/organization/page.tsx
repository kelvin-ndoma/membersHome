// app/organization/page.tsx
import { getCurrentUser } from "@/lib/auth/session"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function OrganizationPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/')
  }

  // Get user's organization memberships
  const memberships = await prisma.membership.findMany({
    where: {
      userId: user.id,
      status: "ACTIVE",
    },
    include: {
      organization: true,
    },
    orderBy: {
      organization: {
        name: 'asc'
      }
    }
  })

  // If user has only one organization, redirect directly to it
  if (memberships.length === 1) {
    redirect(`/organization/${memberships[0].organization.slug}/dashboard`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Organizations</h1>
          <p className="mt-2 text-gray-600">
            {user.name || user.email}, select an organization to continue
          </p>
        </div>

        {memberships.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              No Organizations Assigned
            </h2>
            <p className="text-gray-600 mb-6">
              Your account doesn't have access to any organizations yet.
              Organizations are created and assigned by the platform administrator.
            </p>
            <div className="space-y-4 max-w-md mx-auto">
              <button
                onClick={() => window.location.href = '/'}
                className="block w-full bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 font-medium"
              >
                Return to Home
              </button>
              <div className="text-sm text-gray-500">
                Please contact your administrator or platform support
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {memberships.map((membership) => (
              <Link
                key={membership.id}
                href={`/organization/${membership.organization.slug}/dashboard`}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200 hover:border-blue-300"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="font-semibold text-blue-600">
                          {membership.organization.name.charAt(0)}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {membership.organization.name}
                      </h3>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      membership.organizationRole === 'ORG_OWNER' 
                        ? 'bg-purple-100 text-purple-800'
                        : membership.organizationRole === 'ORG_ADMIN'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {membership.organizationRole.replace('ORG_', '').toLowerCase()}
                    </span>
                  </div>
                  
                  {membership.organization.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {membership.organization.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mt-4 pt-4 border-t border-gray-100">
                    <div className="text-left">
                      <div className="font-medium text-gray-900">
                        {membership.organization.plan} Plan
                      </div>
                      <div className="text-xs">
                        Click to enter
                      </div>
                    </div>
                    <div className="text-blue-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Information Box */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Need access to another organization?
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Organizations are managed by platform administrators. If you need access to 
                  another organization, please contact your administrator or reach out to 
                  platform support.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}