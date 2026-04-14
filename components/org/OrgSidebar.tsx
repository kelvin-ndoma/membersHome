// components/org/OrgSidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard,
  Home,
  BarChart3,
  Shield,
  Settings,
  ChevronRight,
  Eye,
} from 'lucide-react'

interface OrgSidebarProps {
  orgSlug: string
  isAdmin: boolean
  mobile?: boolean
  onClose?: () => void
}

export default function OrgSidebar({ orgSlug, isAdmin, mobile, onClose }: OrgSidebarProps) {
  const pathname = usePathname()

  const navigation = [
    { name: 'Dashboard', href: `/org/${orgSlug}/dashboard`, icon: LayoutDashboard, adminOnly: false },
    { name: 'Houses', href: `/org/${orgSlug}/houses`, icon: Home, adminOnly: false },
  ]

  const adminNavigation = [
    { name: 'Reports', href: `/org/${orgSlug}/reports`, icon: BarChart3, adminOnly: true },
    { name: 'Audit Logs', href: `/org/${orgSlug}/audit-logs`, icon: Shield, adminOnly: true },
    { name: 'Settings', href: `/org/${orgSlug}/settings`, icon: Settings, adminOnly: true },
  ]

  const filteredNav = navigation.filter(item => !item.adminOnly || isAdmin)
  const filteredAdminNav = adminNavigation.filter(item => !item.adminOnly || isAdmin)

  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    if (onClose) onClose()
    window.location.href = href
  }

  return (
    <aside className={`${mobile ? 'block' : 'hidden lg:block'} lg:fixed lg:inset-y-0 lg:left-0 lg:z-20 lg:w-64 lg:pt-16 lg:bg-white lg:border-r lg:border-gray-200`}>
      <nav className="h-full overflow-y-auto p-4 space-y-6">
        {/* Main Navigation */}
        <div className="space-y-1">
          <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Organization
          </p>
          {filteredNav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={(e) => handleNavigation(e, item.href)}
                className={`
                  group flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition
                  ${isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'}`} />
                  {item.name}
                </div>
                {isActive && <ChevronRight className="h-4 w-4 text-blue-600" />}
              </Link>
            )
          })}
        </div>

        {/* Admin Navigation */}
        {filteredAdminNav.length > 0 && isAdmin && (
          <div className="border-t border-gray-100 pt-4">
            <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Administration
            </p>
            <div className="space-y-1">
              {filteredAdminNav.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={(e) => handleNavigation(e, item.href)}
                    className={`
                      group flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition
                      ${isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'}`} />
                      {item.name}
                    </div>
                    {isActive && <ChevronRight className="h-4 w-4 text-blue-600" />}
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </nav>
    </aside>
  )
}