// components/org/OrgLayoutWrapper.tsx
'use client'

import { usePathname } from 'next/navigation'
import OrgHeader from './OrgHeader'
import OrgSidebar from './OrgSidebar'

interface OrgLayoutWrapperProps {
  children: React.ReactNode
  orgSlug: string
  orgName: string
  userRole: string
  isAdmin: boolean
}

export default function OrgLayoutWrapper({ 
  children, 
  orgSlug, 
  orgName, 
  userRole, 
  isAdmin 
}: OrgLayoutWrapperProps) {
  const pathname = usePathname()
  
  // Check if this is a house page
  const isHousePage = pathname.includes(`/org/${orgSlug}/houses/`)
  
  // If it's a house page, just render children without org header/sidebar
  if (isHousePage) {
    return <>{children}</>
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <OrgHeader 
        orgSlug={orgSlug} 
        orgName={orgName} 
        userRole={userRole} 
      />
      <div className="flex">
        <OrgSidebar 
          orgSlug={orgSlug} 
          isAdmin={isAdmin}
        />
        <main className="flex-1 lg:pl-64">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}