"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

export default function Navbar() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + "/")
  }

  // Don't show navbar on auth pages
  if (pathname?.startsWith("/auth/")) {
    return null
  }

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900">
              MembersHome
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {status === "loading" ? (
              <div className="animate-pulse h-8 w-20 bg-gray-200 rounded"></div>
            ) : session?.user ? (
              <>
                <Link
                  href="/organization"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/organization')
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Organizations
                </Link>
                
                {/* User dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-2 focus:outline-none"
                  >
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {session.user.name?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase() || "U"}
                    </div>
                    <span className="text-sm text-gray-700">
                      {session.user.name?.split(' ')[0] || session.user.email?.split('@')[0]}
                    </span>
                    <svg 
                      className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown menu */}
                  {isDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setIsDropdownOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 border border-gray-200">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900">{session.user.name || "User"}</p>
                          <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
                        </div>
                        <Link
                          href="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          Your Profile
                        </Link>
                        <Link
                          href="/settings"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          Settings
                        </Link>
                        <div className="border-t border-gray-100 my-1"></div>
                        <Link
                          href="/api/auth/signout"
                          className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          Sign out
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/auth/login"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/register"
                  className="text-sm bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}