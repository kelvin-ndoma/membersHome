// components/public/PublicHeader.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { 
  Menu, 
  X, 
  Calendar, 
  Users, 
  CreditCard,
  Building2,
} from 'lucide-react'

interface PublicHeaderProps {
  orgName?: string
  houseName?: string
}

export default function PublicHeader({ orgName, houseName }: PublicHeaderProps) {
  const params = useParams()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const orgSlug = params?.orgSlug as string
  const houseSlug = params?.houseSlug as string

  const navigation = orgSlug && houseSlug ? [
    { name: 'Home', href: `/${orgSlug}/${houseSlug}` },
    { name: 'Events', href: `/${orgSlug}/${houseSlug}/events` },
    { name: 'Membership', href: `/${orgSlug}/${houseSlug}/membership` },
    { name: 'About', href: `/${orgSlug}/${houseSlug}/about` },
  ] : []

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href={orgSlug && houseSlug ? `/${orgSlug}/${houseSlug}` : '/'} className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                {houseName || orgName || 'MembersHome'}
              </span>
            </Link>

            {/* Desktop Navigation */}
            {navigation.length > 0 && (
              <div className="hidden md:flex items-center gap-6">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`text-sm font-medium transition ${
                        isActive
                          ? 'text-blue-600'
                          : 'text-gray-700 hover:text-gray-900'
                      }`}
                    >
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {orgSlug && houseSlug && (
              <>
                <Link
                  href={`/apply/${orgSlug}/${houseSlug}`}
                  className="hidden md:inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
                >
                  <Users className="h-4 w-4" />
                  Join Now
                </Link>
                <Link
                  href="/login"
                  className="hidden md:inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Sign In
                </Link>
              </>
            )}

            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && navigation.length > 0 && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block px-3 py-2 rounded-lg text-base font-medium ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {item.name}
                  </Link>
                )
              })}
              <div className="pt-4 space-y-2">
                <Link
                  href={`/apply/${orgSlug}/${houseSlug}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full text-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Join Now
                </Link>
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full text-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}