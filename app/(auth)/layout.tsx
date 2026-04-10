// app/(auth)/layout.tsx
import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="flex min-h-screen">
        {/* Left Panel - Branding (Hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 p-12 text-white relative overflow-hidden">
          {/* Abstract Background Shapes */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
          </div>
          
          {/* Geometric Pattern */}
          <div className="absolute inset-0 opacity-5">
            <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="white" />
              </pattern>
              <rect width="100" height="100" fill="url(#dots)" />
            </svg>
          </div>
          
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <Link href="/" className="inline-block group">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:bg-white/30 transition">
                    <span className="text-white font-bold text-2xl">M</span>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">MembersHome</h1>
                    <p className="text-blue-100 text-sm mt-0.5">Complete membership management</p>
                  </div>
                </div>
              </Link>
            </div>
            
            <div className="space-y-8">
              <div>
                <h2 className="text-4xl font-bold leading-tight mb-4">
                  Manage your<br />membership organization<br />with ease
                </h2>
                <p className="text-blue-100 text-lg">
                  Everything you need to run a successful membership-based organization.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Member Management</h3>
                    <p className="text-blue-100 text-sm">Track members, profiles, and applications seamlessly</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Event & Ticketing</h3>
                    <p className="text-blue-100 text-sm">Create events, sell tickets, and track attendance</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Payment Processing</h3>
                    <p className="text-blue-100 text-sm">Accept payments for memberships and events</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="w-2 h-2 bg-blue-300 rounded-full"></div>
                ))}
              </div>
              <p className="text-blue-100 text-sm">
                Trusted by thousands of organizations worldwide
              </p>
            </div>
          </div>
        </div>
        
        {/* Right Panel - Auth Forms */}
        <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white/50 backdrop-blur-sm">
          <div className="mx-auto w-full max-w-md">
            {/* Mobile Logo (Visible only on mobile) */}
            <div className="lg:hidden text-center mb-8">
              <Link href="/" className="inline-block">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-xl">M</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">MembersHome</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">Complete membership management</p>
              </Link>
            </div>
            
            {/* Auth Card */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-gray-100">
              {children}
            </div>
            
            {/* Footer */}
            <div className="mt-6 text-center text-sm text-gray-500">
              <p>
                By continuing, you agree to our{' '}
                <Link href="/terms" className="text-blue-600 hover:text-blue-700 font-medium">
                  Terms
                </Link>
                {' '}&{' '}
                <Link href="/privacy" className="text-blue-600 hover:text-blue-700 font-medium">
                  Privacy
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}