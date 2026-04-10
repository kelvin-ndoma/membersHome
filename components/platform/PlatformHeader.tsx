// components/platform/PlatformHeader.tsx
'use client'

import { signOut } from 'next-auth/react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, LogOut, Settings, ChevronDown, LayoutDashboard } from 'lucide-react'

export default function PlatformHeader() {
  const { data: session } = useSession()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  return (
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
            <Link href="/platform/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">M</span>
              </div>
              <span className="text-lg font-semibold text-gray-900 hidden sm:block">
                MembersHome Platform
              </span>
            </Link>
            <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
              Platform Admin
            </span>
          </div>

          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 transition"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {session?.user?.name?.[0] || 'A'}
                </span>
              </div>
              <ChevronDown className="hidden sm:block h-4 w-4 text-gray-400" />
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                  <Link
                    href="/platform/settings"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Settings className="h-4 w-4" />
                    Platform Settings
                  </Link>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    User Dashboard
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
    </header>
  )
}