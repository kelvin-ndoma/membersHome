// app/page.tsx - Updated (Login-focused)
import { getServerSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import LoginForm from '@/components/auth/LoginForm'

export default async function Home() {
  const session = await getServerSession()

  // If user is logged in, redirect to their organization dashboard
  if (session?.user) {
    // Get user's primary organization
    const { prisma } = await import('@/lib/db')
    
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: {
        memberships: {
          where: { status: 'ACTIVE' },
          include: {
            organization: true
          },
          orderBy: { joinedAt: 'desc' },
          take: 1
        }
      }
    })

    if (user?.memberships[0]) {
      redirect(`/organization/${user.memberships[0].organization.slug}/dashboard`)
    }
    
    // If no organization, show welcome page
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome {user?.name || user?.email}!
          </h1>
          <p className="text-gray-600 mb-8">
            Your organization is being set up. Please contact support.
          </p>
        </div>
      </div>
    )
  }

  // If NOT logged in, show login page
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>
      
      <div className="relative min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                MembersHome
              </h1>
              <p className="text-gray-600 mt-2">
                Organization Management Platform
              </p>
            </div>

            <LoginForm />
            
            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center">
                Don't have an account?{' '}
                <a href="/auth/register" className="text-blue-600 hover:text-blue-700 font-medium">
                  Contact Sales
                </a>
              </p>
              <p className="text-xs text-gray-500 text-center mt-2">
                Organizations are created by the platform administrator after purchase
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}