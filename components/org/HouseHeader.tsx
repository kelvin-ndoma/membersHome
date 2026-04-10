// components/org/HouseHeader.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { 
  Menu,
  Home,
  ChevronDown,
  LogOut,
  Settings,
  LayoutDashboard,
  ArrowLeft,
  Building2,
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import HouseMobileSidebar from './HouseMobileSidebar'

interface HouseHeaderProps {
  orgSlug: string
  houseSlug: string
  houseName: string
  userRole: string
}

export default function HouseHeader({ orgSlug, houseSlug, houseName, userRole }: HouseHeaderProps) {
  const { data: session } = useSession()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const getRoleBadge = () => {
    const roles: Record<string, { label: string; color: string }> = {
      'HOUSE_MANAGER': { label: 'Manager', color: 'bg-blue-100 text-blue-800' },
      'HOUSE_ADMIN': { label: 'Admin', color: 'bg-purple-100 text-purple-800' },
      'HOUSE_STAFF': { label: 'Staff', color: 'bg-orange-100 text-orange-800' },
      'HOUSE_MEMBER': { label: 'Member', color: 'bg-gray-100 text-gray-800' },
    }
    return roles[userRole] || { label: userRole, color: 'bg-gray-100 text-gray-800' }
  }

  const roleBadge = getRoleBadge()

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              {/* Mobile menu button */}
              <button
                type="button"
                className="lg:hidden -ml-2 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                onClick={() => setShowMobileMenu(true)}
              >
                <Menu className="h-6 w-6" />
              </button>

              {/* Breadcrumb Navigation */}
              <div className="hidden sm:flex items-center gap-2 text-sm">
                <Link
                  href={`/org/${orgSlug}/dashboard`}
                  className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition"
                >
                  <Building2 className="h-4 w-4" />
                  <span>Organization</span>
                </Link>
                <span className="text-gray-300">/</span>
                <Link
                  href={`/org/${orgSlug}/houses`}
                  className="text-gray-500 hover:text-gray-700 transition"
                >
                  Houses
                </Link>
                <span className="text-gray-300">/</span>
                <span className="font-medium text-gray-900">{houseName}</span>
              </div>

              {/* Mobile breadcrumb */}
              <Link
                href={`/org/${orgSlug}/dashboard`}
                className="sm:hidden flex items-center gap-1 text-sm text-gray-500"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Link>

              {/* House Name & Role */}
              <div className="hidden md:flex items-center gap-2 ml-2 pl-2 border-l border-gray-200">
                <div className="w-7 h-7 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <Home className="h-4 w-4 text-white" />
                </div>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${roleBadge.color}`}>
                  {roleBadge.label}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                title="Switch to Dashboard"
              >
                <LayoutDashboard className="h-5 w-5" />
              </Link>

              {/* User menu */}
              <div className="relative">
                <button
                  type="button"
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 transition"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {session?.user?.name?.[0] || session?.user?.email?.[0] || 'U'}
                    </span>
                  </div>
                  <ChevronDown className="hidden sm:block h-4 w-4 text-gray-400" />
                </button>

                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {session?.user?.name || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {session?.user?.email}
                        </p>
                      </div>
                      <Link
                        href={`/org/${orgSlug}/houses/${houseSlug}/settings`}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings className="h-4 w-4" />
                        House Settings
                      </Link>
                      <Link
                        href={`/org/${orgSlug}/settings`}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Building2 className="h-4 w-4" />
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
      <HouseMobileSidebar 
        orgSlug={orgSlug}
        houseSlug={houseSlug}
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
      />
    </>
  )
}