// components/platform/PlatformHeader.tsx
'use client'

import { signOut } from 'next-auth/react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, LogOut, Settings, ChevronDown, LayoutDashboard, Shield, Building2, Users, BarChart3, FileText, CreditCard } from 'lucide-react'
import { ThemeBadge } from '@/components/ui/ThemeBadge'
import { ThemeButton } from '@/components/ui/ThemeButton'

export default function PlatformHeader() {
  const { data: session } = useSession()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Mobile menu button */}
          <ThemeButton
            variant="ghost"
            size="sm"
            className="lg:hidden -ml-2"
            onClick={() => setShowMobileMenu(true)}
          >
            <Menu className="h-5 w-5" />
          </ThemeButton>

          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link href="/platform/dashboard" className="flex items-center gap-3">
              {/* Fixed: Added proper contrast - using theme color for background */}
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" 
                   style={{ 
                     background: `linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-secondary) 100%)` 
                   }}>
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="text-lg font-bold text-gray-900">MembersHome</span>
                <span className="text-lg font-normal text-gray-500 ml-1">Platform</span>
              </div>
            </Link>
            <ThemeBadge variant="primary" size="sm" className="hidden sm:inline-flex">
              Admin
            </ThemeBadge>
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-gray-50 transition"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              {/* Fixed: Avatar with proper contrast */}
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-medium"
                   style={{ 
                     background: `linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-secondary) 100%)` 
                   }}>
                {session?.user?.name?.[0] || session?.user?.email?.[0] || 'A'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900 leading-tight">
                  {session?.user?.name || 'Admin'}
                </p>
                <p className="text-xs text-gray-500 leading-tight">
                  {session?.user?.email}
                </p>
              </div>
              <ChevronDown className="hidden sm:block h-4 w-4 text-gray-400" />
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                  <div className="px-4 py-3 border-b border-gray-100 md:hidden">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {session?.user?.name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {session?.user?.email}
                    </p>
                  </div>
                  <Link
                    href="/platform/settings"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Settings className="h-4 w-4 text-gray-400" />
                    Platform Settings
                  </Link>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <LayoutDashboard className="h-4 w-4 text-gray-400" />
                    Switch to User Dashboard
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

      {/* Mobile menu */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/20" onClick={() => setShowMobileMenu(false)} />
          <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                     style={{ 
                       background: `linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-secondary) 100%)` 
                     }}>
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <span className="text-lg font-bold text-gray-900">MembersHome</span>
              </div>
              <ThemeButton
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileMenu(false)}
              >
                <X className="h-5 w-5" />
              </ThemeButton>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <nav className="space-y-1">
                <Link
                  href="/platform/dashboard"
                  onClick={() => setShowMobileMenu(false)}
                  className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <LayoutDashboard className="h-5 w-5 text-gray-400" />
                  Dashboard
                </Link>
                <Link
                  href="/platform/organizations"
                  onClick={() => setShowMobileMenu(false)}
                  className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <Building2 className="h-5 w-5 text-gray-400" />
                  Organizations
                </Link>
                <Link
                  href="/platform/users"
                  onClick={() => setShowMobileMenu(false)}
                  className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <Users className="h-5 w-5 text-gray-400" />
                  Users
                </Link>
                <Link
                  href="/platform/analytics"
                  onClick={() => setShowMobileMenu(false)}
                  className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <BarChart3 className="h-5 w-5 text-gray-400" />
                  Analytics
                </Link>
                <Link
                  href="/platform/audit-logs"
                  onClick={() => setShowMobileMenu(false)}
                  className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <FileText className="h-5 w-5 text-gray-400" />
                  Audit Logs
                </Link>
                <Link
                  href="/platform/billing"
                  onClick={() => setShowMobileMenu(false)}
                  className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <CreditCard className="h-5 w-5 text-gray-400" />
                  Billing
                </Link>
                <Link
                  href="/platform/settings"
                  onClick={() => setShowMobileMenu(false)}
                  className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <Settings className="h-5 w-5 text-gray-400" />
                  Settings
                </Link>
              </nav>
            </div>
            <div className="p-4 border-t">
              <button
                type="button"
                className="flex items-center gap-3 w-full px-3 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
                onClick={() => signOut({ callbackUrl: '/login' })}
              >
                <LogOut className="h-5 w-5" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}