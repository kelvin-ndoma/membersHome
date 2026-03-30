"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  Calendar,
  Ticket,
  Mail,
  Settings,
  LogOut,
  BarChart3,
  UserCog,
} from "lucide-react"
import { SignOutButton } from "@/components/auth/SignOutButton"
import { RoleBasedMenu } from "./RoleBasedMenu"

interface HouseSidebarProps {
  orgSlug: string
  houseSlug: string
  userRole: "HOUSE_MEMBER" | "HOUSE_STAFF" | "HOUSE_MANAGER" | "HOUSE_ADMIN"
  isOpen?: boolean
  onClose?: () => void
}

export function HouseSidebar({ 
  orgSlug, 
  houseSlug, 
  userRole,
  isOpen = true, 
  onClose 
}: HouseSidebarProps) {
  const pathname = usePathname()

  const allRoutes = [
    {
      href: `/house/${orgSlug}/${houseSlug}/dashboard`,
      label: "Dashboard",
      icon: LayoutDashboard,
      roles: ["HOUSE_MEMBER", "HOUSE_STAFF", "HOUSE_MANAGER", "HOUSE_ADMIN"],
    },
    {
      href: `/house/${orgSlug}/${houseSlug}/members`,
      label: "Members",
      icon: Users,
      roles: ["HOUSE_MEMBER", "HOUSE_STAFF", "HOUSE_MANAGER", "HOUSE_ADMIN"],
    },
    {
      href: `/house/${orgSlug}/${houseSlug}/events`,
      label: "Events",
      icon: Calendar,
      roles: ["HOUSE_MEMBER", "HOUSE_STAFF", "HOUSE_MANAGER", "HOUSE_ADMIN"],
    },
    {
      href: `/house/${orgSlug}/${houseSlug}/tickets`,
      label: "Tickets",
      icon: Ticket,
      roles: ["HOUSE_STAFF", "HOUSE_MANAGER", "HOUSE_ADMIN"],
    },
    {
      href: `/house/${orgSlug}/${houseSlug}/communications`,
      label: "Communications",
      icon: Mail,
      roles: ["HOUSE_STAFF", "HOUSE_MANAGER", "HOUSE_ADMIN"],
    },
    {
      href: `/house/${orgSlug}/${houseSlug}/reports`,
      label: "Reports",
      icon: BarChart3,
      roles: ["HOUSE_MANAGER", "HOUSE_ADMIN"],
    },
    {
      href: `/house/${orgSlug}/${houseSlug}/settings`,
      label: "Settings",
      icon: Settings,
      roles: ["HOUSE_ADMIN"],
    },
  ]

  const routes = allRoutes.filter(route => route.roles.includes(userRole))

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b px-6">
        <Link href={`/house/${orgSlug}/${houseSlug}/dashboard`} className="flex items-center gap-2 font-semibold">
          <span className="text-lg">House Portal</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === route.href || pathname.startsWith(`${route.href}/`)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <route.icon className="h-5 w-5" />
            {route.label}
          </Link>
        ))}
      </nav>

      <div className="border-t p-4">
        <Link
          href={`/organization/${orgSlug}/dashboard`}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <LogOut className="h-5 w-5" />
          Back to Organization
        </Link>
        <SignOutButton variant="ghost" className="mt-2 w-full justify-start gap-3 text-red-600 hover:bg-red-50 hover:text-red-700" />
      </div>
    </div>
  )

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-background/80 md:hidden" onClick={onClose} />
      <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r bg-background md:static md:z-0">
        {sidebarContent}
      </aside>
    </>
  )
}