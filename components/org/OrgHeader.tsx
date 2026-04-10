// components/org/OrgHeader.tsx
'use client'

import { signOut } from 'next-auth/react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useState } from 'react'
import { 
  Menu, 
  LogOut, 
  Settings, 
  ChevronDown,
  LayoutDashboard,
  Building2,
} from 'lucide-react'
import OrgMobileSidebar from './OrgMobileSidebar'

interface OrgHeaderProps {
  orgSlug: string
  orgName: string
  userRole: string
}

export default function OrgHeader({ orgSlug, orgName, userRole }: OrgHeaderProps) {
  const { data: session } = useSession()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const getRoleBadge = () => {
    const roles: Record<string, { label: string; color: string }> = {
      'ORG_OWNER': { label: 'Owner', color: 'bg-blue-100 text-blue-800' },
      'ORG_ADMIN': { label: 'Admin', color: 'bg-purple-100 text-purple-800' },
      'MEMBER': { label: 'Member', color: 'bg-gray-100 text-gray-800' },
    }
    return roles[userRole] || { label: userRole, color: 'bg-gray-100 text-gray-800' }
  }

  const roleBadge = getRoleBadge()

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Mobile menu button */}
            <button
              type="button"
              className="lg:hidden -ml-2 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              onClick={() => setShowMobileMenu(true)}
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Logo and Org Name */}
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

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                title="Switch to User Dashboard"
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
                        href={`/org/${orgSlug}/settings`}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings className="h-4 w-4" />
                        Organization Settings
                      </Link>
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Switch to Dashboard
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