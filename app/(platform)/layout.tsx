"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import SignoutButton from "@/components/auth/SignoutButton"

const navigation = [
  { name: "Dashboard", href: "/platform/dashboard", icon: "📊" },
  { name: "Organizations", href: "/platform/organizations", icon: "🏢" },
  { name: "Users", href: "/platform/users", icon: "👥" },
  { name: "Analytics", href: "/platform/analytics", icon: "📈" },
  { name: "Billing", href: "/platform/billing", icon: "💰" },
  { name: "Settings", href: "/platform/settings", icon: "⚙️" },
]

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated" && session?.user?.platformRole !== "PLATFORM_ADMIN") {
      router.push("/unauthorized")
    }
  }, [status, session, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session || session.user.platformRole !== "PLATFORM_ADMIN") {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Fixed Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/platform/dashboard" className="text-xl font-bold text-blue-600">
                membersHome Platform
              </Link>
              <div className="ml-10 flex items-center space-x-4">
                <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                  Platform Admin
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{session.user.email}</span>
              <SignoutButton variant="text" />
            </div>
          </div>
        </div>
      </nav>

      <div className="flex pt-16">
        {/* Fixed Sidebar */}
        <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white shadow-sm border-r overflow-y-auto">
          <nav className="mt-5 px-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md mb-1 ${
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main Content with margin for fixed sidebar and header */}
        <main className="flex-1 ml-64 p-8 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}