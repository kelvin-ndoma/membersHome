// app/organization/[orgSlug]/organization-shell.tsx
"use client"

import { useState, useEffect } from "react"
import { usePathname, useSearchParams, useRouter } from "next/navigation"
import { OrganizationHeader } from "@/components/organization/Header"
import { OrganizationSidebar } from "@/components/organization/Sidebar"
import { HouseSidebar } from "@/components/organization/HouseSidebar"

interface House {
  id: string
  name: string
  slug: string
}

interface OrganizationShellProps {
  children: React.ReactNode
  orgSlug: string
  organization: {
    id: string
    name: string
    slug: string
    logoUrl?: string | null
  }
  userRole: string
  allHouses: House[]
  selectedHouse: House | null
  isAdmin: boolean
}

export function OrganizationShell({
  children,
  orgSlug,
  organization,
  userRole,
  allHouses,
  selectedHouse: initialSelectedHouse,
  isAdmin,
}: OrganizationShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Get the current house from the URL or props
  const [currentHouse, setCurrentHouse] = useState<House | null>(initialSelectedHouse)
  const [showOrgSidebar, setShowOrgSidebar] = useState(true)

  // Update current house when URL changes
  useEffect(() => {
    const houseId = searchParams.get("houseId")
    if (houseId) {
      const house = allHouses.find(h => h.id === houseId)
      if (house) {
        setCurrentHouse(house)
        setShowOrgSidebar(false) // Hide org sidebar when house is selected
      }
    } else {
      // Check if we're on a house-specific page
      const houseMatch = pathname.match(/\/houses\/([^\/]+)/)
      if (houseMatch) {
        const houseSlug = houseMatch[1]
        const house = allHouses.find(h => h.slug === houseSlug)
        if (house) {
          setCurrentHouse(house)
          setShowOrgSidebar(false) // Hide org sidebar when on house page
        }
      } else {
        setCurrentHouse(null)
        setShowOrgSidebar(true) // Show org sidebar on org-level pages
      }
    }
  }, [pathname, searchParams, allHouses])

  // Handle going back to org dashboard
  const handleBackToOrg = () => {
    setCurrentHouse(null)
    setShowOrgSidebar(true)
    router.push(`/organization/${orgSlug}/dashboard`)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Organization Sidebar - Only visible when no house is selected */}
      {showOrgSidebar && (
        <OrganizationSidebar
          organizationSlug={orgSlug}
          userRole={userRole}
          isAdmin={isAdmin}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      {/* House Sidebar - Only visible when a house is selected */}
      {currentHouse && (
        <HouseSidebar
          orgSlug={orgSlug}
          house={currentHouse}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onBackToOrg={handleBackToOrg}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <OrganizationHeader
          organizationName={organization.name}
          organizationSlug={orgSlug}
          organizationLogo={organization.logoUrl}
          onMenuClick={() => setSidebarOpen(true)}
          selectedHouse={currentHouse}
          onBackToOrg={handleBackToOrg}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}