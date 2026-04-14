// components/org/OrgHeader.tsx
'use client'

import { signOut } from 'next-auth/react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { 
  Menu, 
  LogOut, 
  Settings, 
  ChevronDown,
  LayoutDashboard,
  Building2,
  Eye,
  ExternalLink,
} from 'lucide-react'
import OrgMobileSidebar from './OrgMobileSidebar'

interface OrgHeaderProps {
  orgSlug: string
  orgName: string
  userRole: string
}

interface HouseAccess {
  id: string
  name: string
  slug: string
  role: string
  isStaff: boolean
}

export default function OrgHeader({ orgSlug, orgName, userRole }: OrgHeaderProps) {
  const { data: session } = useSession()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [accessibleHouses, setAccessibleHouses] = useState<HouseAccess[]>([])
  const [isLoadingHouses, setIsLoadingHouses] = useState(true)

  useEffect(() => {
    const fetchHouses = async () => {
      setIsLoadingHouses(true)
      try {
        const response = await fetch(`/api/org/${orgSlug}/my-houses`)
        if (response.ok) {
          const data = await response.json()
          setAccessibleHouses(data.houses || [])
        } else {
          // Silently fail - user may not have access to any houses
          setAccessibleHouses([])
        }
      } catch (error) {
        // Silently fail - network issues shouldn't break the header
        console.error('Failed to fetch houses:', error)
        setAccessibleHouses([])
      } finally {
        setIsLoadingHouses(false)
      }
    }
    
    if (orgSlug) {
      fetchHouses()
    }
  }, [orgSlug])

  const getRoleBadge = () => {
    const roles: Record<string, { label: string; color: string }> = {
      'ORG_OWNER': { label: 'Owner', color: 'bg-blue-100 text-blue-800' },
      'ORG_ADMIN': { label: 'Admin', color: 'bg-purple-100 text-purple-800' },
      'MEMBER': { label: 'Member', color: 'bg-gray-100 text-gray-800' },
    }
    return roles[userRole] || { label: userRole, color: 'bg-gray-100 text-gray-800' }
  }

  const roleBadge = getRoleBadge()
  
  // Filter houses where user can access portal (staff or org admin)
  const portalAccessHouses = accessibleHouses.filter(h => 
    h.isStaff || userRole === 'ORG_OWNER' || userRole === 'ORG_ADMIN'
  )

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              type="button"
              className="lg:hidden -ml-2 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              onClick={() => setShowMobileMenu(true)}
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex items-center gap-3">
              <Link href={`/org/${orgSlug}/dashboard`} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="text-lg font-semibold text-gray-900">{orgName}</span>
                  <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${roleBadge.color}`}>
                    {roleBadge.label}
                  </span>
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                title="Switch to User Dashboard"
              >
                <LayoutDashboard className="h-5 w-5" />
              </Link>

              <div className="relative">
                <button
                  type="button"
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 transition"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {session?.user?.name?.[0] || session?.user?.email?.[0] || 'U'}
                    </span>
                  </div>
                  <ChevronDown className="hidden sm:block h-4 w-4 text-gray-400" />
                </button>

                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {session?.user?.name || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {session?.user?.email}
                        </p>
                      </div>
                      
                      {/* View Portal Options */}
                      {!isLoadingHouses && portalAccessHouses.length > 0 && (
                        <>
                          <div className="border-t border-gray-100 my-1" />
                          <p className="px-4 py-1 text-xs text-gray-500 flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            View Member Portal
                          </p>
                          {portalAccessHouses.map((house) => (
                            <Link
                              key={house.id}
                              href={`/portal/${house.slug}/dashboard`}
                              target="_blank"
                              className="flex items-center justify-between px-4 py-2.5 text-sm text-purple-700 hover:bg-purple-50"
                              onClick={() => setShowUserMenu(false)}
                            >
                              <span className="flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                {house.name}
                              </span>
                              <ExternalLink className="h-3 w-3 opacity-50" />
                            </Link>
                          ))}
                        </>
                      )}

                      <div className="border-t border-gray-100 my-1" />
                      
                      <Link
                        href={`/org/${orgSlug}/settings`}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings className="h-4 w-4" />
                        Organization Settings
                      </Link>
                      <div className="border-t border-gray-100 my-1" />
                      <button
                        type="button"
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                        onClick={() => signOut({ callbackUrl: '/login' })}
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
      <OrgMobileSidebar 
        orgSlug={orgSlug} 
        isOpen={showMobileMenu} 
        onClose={() => setShowMobileMenu(false)} 
      />
    </>
  )
}