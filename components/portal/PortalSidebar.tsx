// components/portal/PortalSidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Calendar,
  Ticket,
  Users,
  MessageSquare,
  CreditCard,
  UserCircle,
  Settings,
  ChevronRight,
  Home,
} from 'lucide-react'

interface PortalSidebarProps {
  houseSlug: string
  mobile?: boolean
  onClose?: () => void
}

export default function PortalSidebar({ houseSlug, mobile, onClose }: PortalSidebarProps) {
  const pathname = usePathname()

  const navigation = [
    { name: 'Dashboard', href: `/portal/${houseSlug}/dashboard`, icon: LayoutDashboard },
    // { name: 'My Houses', href: '/portal/my-houses', icon: Home },
    { name: 'Events', href: `/portal/${houseSlug}/events`, icon: Calendar },
    { name: 'My Tickets', href: `/portal/${houseSlug}/tickets`, icon: Ticket },
    { name: 'Directory', href: `/portal/${houseSlug}/directory`, icon: Users },
    { name: 'Messages', href: `/portal/${houseSlug}/messages`, icon: MessageSquare },
    { name: 'Billing', href: `/portal/${houseSlug}/billing`, icon: CreditCard },
    { name: 'Membership', href: `/portal/${houseSlug}/membership`, icon: UserCircle },
    { name: 'Settings', href: `/portal/${houseSlug}/settings`, icon: Settings },
  ]

  return (
    <aside className={`
      ${mobile ? 'block' : 'hidden lg:block'} 
      lg:fixed lg:inset-y-0 lg:left-0 lg:z-20 lg:w-64 lg:pt-16 
      bg-white border-r border-gray-200
    `}>
      <nav className="h-full overflow-y-auto p-4 space-y-6">
        <div className="space-y-1">
          <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Member Menu
          </p>
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`
                  group flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition
                  ${isActive
                    ? 'bg-purple-50 text-purple-700'
                    : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`h-5 w-5 ${
                    isActive ? 'text-purple-600' : 'text-gray-400 group-hover:text-gray-500'
                  }`} />
                  {item.name}
                </div>
                {isActive && <ChevronRight className="h-4 w-4 text-purple-600" />}
              </Link>
            )
          })}
        </div>
      </nav>
    </aside>
  )
}