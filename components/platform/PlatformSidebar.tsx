// components/platform/PlatformSidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  BarChart3, 
  FileText,
  CreditCard,
  Settings,
  ChevronRight
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/platform/dashboard', icon: LayoutDashboard },
  { name: 'Organizations', href: '/platform/organizations', icon: Building2 },
  { name: 'Users', href: '/platform/users', icon: Users },
  { name: 'Analytics', href: '/platform/analytics', icon: BarChart3 },
  { name: 'Audit Logs', href: '/platform/audit-logs', icon: FileText },
  { name: 'Billing', href: '/platform/billing', icon: CreditCard },
  { name: 'Settings', href: '/platform/settings', icon: Settings },
]

interface PlatformSidebarProps {
  mobile?: boolean
  onClose?: () => void
}

export default function PlatformSidebar({ mobile, onClose }: PlatformSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className={`${mobile ? 'block' : 'hidden lg:block'} lg:fixed lg:inset-y-0 lg:left-0 lg:z-20 lg:w-64 lg:pt-16 lg:bg-white lg:border-r lg:border-gray-200`}>
      <nav className="space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
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
      </nav>
    </aside>
  )
}