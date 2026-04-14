// components/portal/PortalHeader.tsx
'use client'

import { useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Menu,
  LogOut,
  Home,
  Building2,
  User,
  Settings,
  ChevronDown,
  Bell,
  Search,
  X,
  ExternalLink,
} from 'lucide-react'
import PortalMobileSidebar from './PortalMobileSidebar'

interface PortalHeaderProps {
  houseSlug: string
  orgSlug: string
  houseName: string
  userRole: string
}

export default function PortalHeader({ houseSlug, orgSlug, houseName, userRole }: PortalHeaderProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSearch, setShowSearch] = useState(false)

  const isStaff = ['HOUSE_MANAGER', 'HOUSE_ADMIN', 'HOUSE_STAFF', 'ORG_ADMIN', 'ORG_OWNER'].includes(userRole)

  // Mock notifications
  const notifications = [
    { id: 1, title: 'New event added', message: 'Summer Mixer is happening next week!', time: '2h ago', read: false },
    { id: 2, title: 'Member joined', message: 'John Doe joined the house', time: '1d ago', read: true },
  ]

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left section */}
            <div className="flex items-center gap-4">
              {/* Mobile menu button */}
              <button
                type="button"
                className="lg:hidden -ml-2 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition"
                onClick={() => setShowMobileMenu(true)}
              >
                <Menu className="h-6 w-6" />
              </button>

              {/* Logo & House Name */}
              <Link 
                href={`/portal/${houseSlug}/dashboard`} 
                className="flex items-center gap-3 group"
              >
                <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition">
                  <Home className="h-5 w-5 text-white" />
                </div>
                <div className="hidden sm:block">
                  <span className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition">
                    {houseName}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Member Portal</span>
                    {isStaff && (
                      <span className="px-1.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded">
                        {userRole === 'HOUSE_MANAGER' ? 'Manager' : 
                         userRole === 'HOUSE_ADMIN' ? 'Admin' : 
                         userRole === 'HOUSE_STAFF' ? 'Staff' : 'Admin'}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </div>

            {/* Right section */}
            <div className="flex items-center gap-1">
              {/* Search button */}
              <button
                type="button"
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                onClick={() => setShowSearch(!showSearch)}
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Notifications */}
              <div className="relative">
                <button
                  type="button"
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition relative"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>

                {/* Notifications dropdown */}
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20">
                      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                          <span className="text-xs text-purple-600 hover:text-purple-700 cursor-pointer">
                            Mark all read
                          </span>
                        )}
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center">
                            <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No notifications</p>
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <div 
                              key={notification.id}
                              className={`px-4 py-3 hover:bg-gray-50 transition border-b border-gray-50 last:border-0 ${
                                !notification.read ? 'bg-purple-50/50' : ''
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-2 h-2 rounded-full mt-2 ${
                                  !notification.read ? 'bg-purple-500' : 'bg-transparent'
                                }`} />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                                  <p className="text-xs text-gray-600 mt-0.5">{notification.message}</p>
                                  <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="border-t border-gray-100 px-4 py-2">
                        <Link 
                          href={`/portal/${houseSlug}/notifications`}
                          className="text-xs text-purple-600 hover:text-purple-700"
                        >
                          View all notifications
                        </Link>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Back to Admin button */}
              {isStaff && (
                <Link
                  href={`/org/${orgSlug}/houses/${houseSlug}/dashboard`}
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  title="Switch to Admin View"
                >
                  <Building2 className="h-4 w-4" />
                  <span>Admin</span>
                  <ExternalLink className="h-3 w-3 opacity-50" />
                </Link>
              )}

              {/* User Menu */}
              <div className="relative">
                <button
                  type="button"
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 transition"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-sm">
                    {session?.user?.image ? (
                      <img src={session.user.image} alt="" className="w-8 h-8 rounded-full" />
                    ) : (
                      <span className="text-white text-sm font-medium">
                        {session?.user?.name?.[0] || session?.user?.email?.[0] || 'M'}
                      </span>
                    )}
                  </div>
                  <ChevronDown className="hidden sm:block h-4 w-4 text-gray-400" />
                </button>

                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20">
                      {/* User info */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {session?.user?.name || 'Member'}
                        </p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {session?.user?.email}
                        </p>
                      </div>
                      
                      {/* Mobile Admin Link */}
                      {isStaff && (
                        <Link
                          href={`/org/${orgSlug}/houses/${houseSlug}/dashboard`}
                          className="sm:hidden flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Building2 className="h-4 w-4" />
                          Switch to Admin View
                          <ExternalLink className="h-3 w-3 opacity-50 ml-auto" />
                        </Link>
                      )}
                      
                      {/* Menu items */}
                      <Link
                        href={`/portal/${houseSlug}/profile`}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User className="h-4 w-4" />
                        Your Profile
                      </Link>
                      <Link
                        href={`/portal/${houseSlug}/settings`}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings className="h-4 w-4" />
                        Account Settings
                      </Link>
                      <Link
                        href="/portal/my-houses"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Home className="h-4 w-4" />
                        My Houses
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

        {/* Search bar (expandable) */}
        {showSearch && (
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search members, events, tickets..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                autoFocus
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                onClick={() => setShowSearch(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Sidebar */}
      <PortalMobileSidebar 
        houseSlug={houseSlug}
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
      />
    </>
  )
}