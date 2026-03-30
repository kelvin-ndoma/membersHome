"use client"

import { useState } from "react"
import { OrganizationHeader } from "@/components/organization/Header"
import { OrganizationSidebar } from "@/components/organization/Sidebar"

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
}

export function OrganizationShell({
  children,
  orgSlug,
  organization,
  userRole,
}: OrganizationShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <OrganizationSidebar
        organizationSlug={orgSlug}
        userRole={userRole}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <OrganizationHeader
          organizationName={organization.name}
          organizationSlug={orgSlug}
          organizationLogo={organization.logoUrl}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}