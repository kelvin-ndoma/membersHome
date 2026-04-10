// components/org/HouseSidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard,
  Users,
  Calendar,
  Ticket,
  Package,
  FileText,
  Send,
  FormInput,
  BarChart3,
  Shield,
  Settings,
  ChevronRight,
  Home,
} from 'lucide-react'

interface HouseSidebarProps {
  orgSlug: string
  houseSlug: string
  isAdmin: boolean
  mobile?: boolean
  onClose?: () => void
}

export default function HouseSidebar({ orgSlug, houseSlug, isAdmin, mobile, onClose }: HouseSidebarProps) {
  const pathname = usePathname()

  const basePath = `/org/${orgSlug}/houses/${houseSlug}`

  const navigation = [
    { name: 'Dashboard', href: `${basePath}/dashboard`, icon: LayoutDashboard, adminOnly: false },
    { name: 'Members', href: `${basePath}/members`, icon: Users, adminOnly: false },
    { name: 'Events', href: `${basePath}/events`, icon: Calendar, adminOnly: false },
    { name: 'Tickets', href: `${basePath}/tickets`, icon: Ticket, adminOnly: false },
  ]

  const adminNavigation = [
    { name: 'Membership Plans', href: `${basePath}/plans`, icon: Package, adminOnly: true },
    { name: 'Applications', href: `${basePath}/applications`, icon: FileText, adminOnly: true },
    { name: 'Communications', href: `${basePath}/communications`, icon: Send, adminOnly: true },
    { name: 'Forms', href: `${basePath}/forms`, icon: FormInput, adminOnly: true },
    { name: 'Reports', href: `${basePath}/reports`, icon: BarChart3, adminOnly: true },
    { name: 'Audit Logs', href: `${basePath}/audit-logs`, icon: Shield, adminOnly: true },
    { name: 'Settings', href: `${basePath}/settings`, icon: Settings, adminOnly: true },
  ]

  const filteredNav = navigation.filter(item => !item.adminOnly || isAdmin)
  const filteredAdminNav = adminNavigation.filter(item => !item.adminOnly || isAdmin)

  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    if (onClose) onClose()
    window.location.href = href
  }

  return (
    <aside className={`
      ${mobile ? 'block' : 'hidden lg:block'} 
      lg:fixed lg:inset-y-0 lg:left-0 lg:z-20 lg:w-64 lg:pt-16 
      bg-white border-r border-gray-200
    `}>
      <nav className="h-full overflow-y-auto p-4 space-y-6">
        {/* Back to Org */}
        <a
          href={`/org/${orgSlug}/dashboard`}
          onClick={(e) => {
            e.preventDefault()
            window.location.href = `/org/${orgSlug}/dashboard`
          }}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition"
        >
          <Home className="h-4 w-4" />
          <span>Back to Organization</span>
        </a>

        <div className="border-t border-gray-100 pt-4">
          <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            House Menu
          </p>
          <div className="space-y-1">
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
                      ? 'bg-green-50 text-green-700'
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={`h-5 w-5 ${isActive ? 'text-green-600' : 'text-gray-400 group-hover:text-gray-500'}`} />
                    {item.name}
                  </div>
                  {isActive && <ChevronRight className="h-4 w-4 text-green-600" />}
                </Link>
              )
            })}
          </div>
        </div>

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
                        ? 'bg-green-50 text-green-700'
                        : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={`h-5 w-5 ${isActive ? 'text-green-600' : 'text-gray-400 group-hover:text-gray-500'}`} />
                      {item.name}
                    </div>
                    {isActive && <ChevronRight className="h-4 w-4 text-green-600" />}
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