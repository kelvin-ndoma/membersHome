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
import { ThemeBadge } from '@/components/ui/ThemeBadge'

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

interface OrgSettings {
  logoUrl: string | null
  primaryColor: string | null
  secondaryColor: string | null
  backgroundColor: string | null
}

export default function OrgHeader({ orgSlug, orgName, userRole }: OrgHeaderProps) {
  const { data: session } = useSession()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [accessibleHouses, setAccessibleHouses] = useState<HouseAccess[]>([])
  const [isLoadingHouses, setIsLoadingHouses] = useState(true)
  const [orgSettings, setOrgSettings] = useState<OrgSettings | null>(null)

  useEffect(() => {
    const fetchHouses = async () => {
      setIsLoadingHouses(true)
      try {
        const response = await fetch(`/api/org/${orgSlug}/my-houses`)
        if (response.ok) {
          const data = await response.json()
          setAccessibleHouses(data.houses || [])
        } else {
          setAccessibleHouses([])
        }
      } catch (error) {
        console.error('Failed to fetch houses:', error)
        setAccessibleHouses([])
      } finally {
        setIsLoadingHouses(false)
      }
    }
    
    const fetchOrgSettings = async () => {
      try {
        const response = await fetch(`/api/org/${orgSlug}/settings`)
        if (response.ok) {
          const data = await response.json()
          if (data.organization) {
            setOrgSettings({
              logoUrl: data.organization.logoUrl,
              primaryColor: data.organization.primaryColor,
              secondaryColor: data.organization.secondaryColor,
              backgroundColor: data.organization.backgroundColor,
            })
          }
        }
      } catch (error) {
        console.error('Failed to fetch org settings:', error)
      }
    }
    
    if (orgSlug) {
      fetchHouses()
      fetchOrgSettings()
    }
  }, [orgSlug])

  const getRoleBadge = () => {
    const roles: Record<string, { label: string; variant: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger' | 'default' }> = {
      'ORG_OWNER': { label: 'Owner', variant: 'primary' },
      'ORG_ADMIN': { label: 'Admin', variant: 'secondary' },
      'MEMBER': { label: 'Member', variant: 'default' },
    }
    return roles[userRole] || { label: userRole, variant: 'default' as const }
  }

  const roleBadge = getRoleBadge()
  
  // Filter houses where user can access portal
  const portalAccessHouses = accessibleHouses.filter(h => 
    h.isStaff || userRole === 'ORG_OWNER' || userRole === 'ORG_ADMIN'
  )

  // Get colors for styling
  const primaryColor = orgSettings?.primaryColor || '#0a387c'
  const secondaryColor = orgSettings?.secondaryColor || '#0596eb'
  const backgroundColor = orgSettings?.backgroundColor || '#ffffff'
  const hasLogo = !!orgSettings?.logoUrl

  return (
    <>
      <header 
        className="sticky top-0 z-30 border-b border-gray-200"
        style={{ backgroundColor: backgroundColor }}
      >
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
            <div className="flex items-center gap-4">
              <Link href={`/org/${orgSlug}/dashboard`} className="flex items-center gap-4 group">
                {/* Logo Container - Larger and more visible */}
                <div className="relative">
                  {/* Subtle glow effect on hover */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-theme-primary/20 to-theme-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Main logo container */}
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden shadow-md group-hover:shadow-lg transition-all duration-300"
                    style={!hasLogo ? { 
                      background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` 
                    } : undefined}
                  >
                    {hasLogo ? (
                      <img 
                        src={orgSettings!.logoUrl!} 
                        alt={orgName}
                        className="w-full h-full object-contain p-1.5"
                      />
                    ) : (
                      <Building2 className="h-7 w-7 text-white" />
                    )}
                  </div>
                </div>
                
                {/* Organization Name - More prominent */}
                <div className="hidden sm:block">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900 tracking-tight">
                      {orgName}
                    </span>
                    <ThemeBadge variant={roleBadge.variant} size="md">
                      {roleBadge.label}
                    </ThemeBadge>
                  </div>
                  {/* Optional: Add a subtle tagline or member count here */}
                </div>
              </Link>
              
              {/* Mobile Organization Name */}
              <div className="sm:hidden">
                <span className="text-base font-semibold text-gray-900 truncate max-w-[150px]">
                  {orgName}
                </span>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                title="Switch to User Dashboard"
              >
                <LayoutDashboard className="h-5 w-5" />
              </Link>

              {/* User Menu */}
              <div className="relative">
                <button
                  type="button"
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  {/* User Avatar */}
                  <div 
                    className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden shadow-sm"
                    style={{ 
                      background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` 
                    }}
                  >
                    {session?.user?.image ? (
                      <img 
                        src={session.user.image} 
                        alt={session.user.name || 'User'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-sm font-medium">
                        {session?.user?.name?.[0] || session?.user?.email?.[0] || 'U'}
                      </span>
                    )}
                  </div>
                  <ChevronDown className="hidden sm:block h-4 w-4 text-gray-500" />
                </button>

                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-20">
                      {/* User Info - More prominent */}
                      <div className="px-4 py-4 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md"
                            style={{ 
                              background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` 
                            }}
                          >
                            {session?.user?.image ? (
                              <img 
                                src={session.user.image} 
                                alt={session.user.name || 'User'}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-white text-lg font-medium">
                                {session?.user?.name?.[0] || session?.user?.email?.[0] || 'U'}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-medium text-gray-900 truncate">
                              {session?.user?.name || 'User'}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {session?.user?.email}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* View Portal Options */}
                      {!isLoadingHouses && portalAccessHouses.length > 0 && (
                        <>
                          <p className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            Member Portals
                          </p>
                          {portalAccessHouses.map((house) => (
                            <Link
                              key={house.id}
                              href={`/portal/${house.slug}/dashboard`}
                              target="_blank"
                              className="flex items-center justify-between px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              onClick={() => setShowUserMenu(false)}
                            >
                              <span className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                                  <Building2 className="h-4 w-4 text-purple-600" />
                                </div>
                                <div>
                                  <p className="font-medium">{house.name}</p>
                                  <p className="text-xs text-gray-500">{house.role}</p>
                                </div>
                              </span>
                              <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
                            </Link>
                          ))}
                          <div className="border-t border-gray-100 my-1" />
                        </>
                      )}

                      {/* Organization Settings */}
                      <Link
                        href={`/org/${orgSlug}/settings`}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                          <Settings className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="font-medium">Organization Settings</span>
                      </Link>
                      
                      <div className="border-t border-gray-100 my-1" />
                      
                      {/* Sign Out */}
                      <button
                        type="button"
                        className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        onClick={() => signOut({ callbackUrl: '/login' })}
                      >
                        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                          <LogOut className="h-4 w-4 text-red-600" />
                        </div>
                        <span className="font-medium">Sign out</span>
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