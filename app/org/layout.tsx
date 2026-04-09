"use client"

import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import SignoutButton from "@/components/auth/SignoutButton"

// Org-level navigation
const orgNavigation = (orgSlug: string) => [
  { name: "Dashboard", href: `/org/${orgSlug}/dashboard`, icon: "📊" },
  { name: "Houses", href: `/org/${orgSlug}/houses`, icon: "🏠" },
  { name: "Settings", href: `/org/${orgSlug}/settings`, icon: "⚙️" },
]

// House-level navigation (shown when in a specific house)
const getHouseNavigation = (orgSlug: string, houseSlug: string) => [
  { name: "House Dashboard", href: `/org/${orgSlug}/houses/${houseSlug}/dashboard`, icon: "📊" },
  { name: "Members", href: `/org/${orgSlug}/houses/${houseSlug}/members`, icon: "👥" },
  { name: "Events", href: `/org/${orgSlug}/houses/${houseSlug}/events`, icon: "📅" },
  { name: "Membership Plans", href: `/org/${orgSlug}/houses/${houseSlug}/plans`, icon: "🎫" },
  { name: "Applications", href: `/org/${orgSlug}/houses/${houseSlug}/applications`, icon: "📋" },
  { name: "Communications", href: `/org/${orgSlug}/houses/${houseSlug}/communications`, icon: "📧" },
  { name: "Settings", href: `/org/${orgSlug}/houses/${houseSlug}/settings`, icon: "⚙️" },
]

export default function OrgLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [orgSlug, setOrgSlug] = useState<string | null>(null)
  const [currentHouseSlug, setCurrentHouseSlug] = useState<string | null>(null)

  useEffect(() => {
    if (status === "loading") return
    
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }
    
    if (session?.user) {
      if (session.user.platformRole === "PLATFORM_ADMIN") {
        router.push("/platform/dashboard")
        return
      }
      
      const membership = session.user.memberships?.find(
        (m: any) => m.organizationRole === "ORG_OWNER" && m.status === "ACTIVE"
      )
      
      if (!membership) {
        router.push("/unauthorized")
        return
      }
      
      setOrgSlug(membership.organization.slug)
    }
  }, [status, session, router])

  // Check if we're in a house context
  const isHouseContext = pathname.match(/\/org\/[^/]+\/houses\/[^/]+/)
  const extractedHouseSlug = isHouseContext ? pathname.split("/")[4] : null

  useEffect(() => {
    if (extractedHouseSlug) {
      setCurrentHouseSlug(extractedHouseSlug)
    }
  }, [extractedHouseSlug])

  if (status === "loading" || !orgSlug) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const membership = session.user.memberships?.find(
    (m: any) => m.organizationRole === "ORG_OWNER" && m.status === "ACTIVE"
  )
  const organization = membership?.organization
  const navItems = orgNavigation(orgSlug)
  const houseNavItems = currentHouseSlug ? getHouseNavigation(orgSlug, currentHouseSlug) : []

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Fixed Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href={`/org/${orgSlug}/dashboard`} className="text-xl font-bold text-blue-600">
                {organization?.name || "Organization"}
              </Link>
              
              {/* Current House Badge */}
              {currentHouseSlug && (
                <div className="ml-4">
                  <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    🏠 Managing: {currentHouseSlug}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{session.user.email}</span>
              <SignoutButton variant="text" />
            </div>
          </div>
        </div>
      </nav>

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white shadow-sm border-r overflow-y-auto">
          <nav className="mt-5 px-2">
            {isHouseContext && currentHouseSlug ? (
              // House-level navigation
              <>
                <div className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  House Management
                </div>
                {houseNavItems.map((item) => {
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
                <div className="border-t my-2"></div>
                <Link
                  href={`/org/${orgSlug}/houses`}
                  className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-500 hover:bg-gray-50"
                >
                  <span className="mr-3 text-lg">←</span>
                  Back to All Houses
                </Link>
              </>
            ) : (
              // Org-level navigation
              navItems.map((item) => {
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
              })
            )}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64 p-8 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}