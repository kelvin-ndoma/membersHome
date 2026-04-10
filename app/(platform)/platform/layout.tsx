// app/(platform)/platform/layout.tsx
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/auth.config'
import PlatformSidebar from '@/components/platform/PlatformSidebar'
import PlatformHeader from '@/components/platform/PlatformHeader'

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  if (session.user.platformRole !== 'PLATFORM_ADMIN') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PlatformHeader />
      <div className="flex">
        <PlatformSidebar />
        <main className="flex-1 lg:pl-64">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}