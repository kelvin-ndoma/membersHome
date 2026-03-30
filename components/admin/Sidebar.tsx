"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  Building2,
  Ticket,
  CreditCard,
  FileText,
  Settings,
  LogOut,
  Home,
  BarChart3,
  Shield,
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { signOut } from "next-auth/react"

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname()

  const routes = [
    {
      href: "/admin",
      label: "Dashboard",
      icon: LayoutDashboard,
      active: pathname === "/admin",
    },
    {
      href: "/admin/organizations",
      label: "Organizations",
      icon: Building2,
      active: pathname === "/admin/organizations" || pathname.startsWith("/admin/organizations/"),
    },
    {
      href: "/admin/users",
      label: "Users",
      icon: Users,
      active: pathname === "/admin/users" || pathname.startsWith("/admin/users/"),
    },
    {
      href: "/admin/tickets",
      label: "Tickets",
      icon: Ticket,
      active: pathname === "/admin/tickets" || pathname.startsWith("/admin/tickets/"),
    },
    {
      href: "/admin/billing",
      label: "Billing",
      icon: CreditCard,
      active: pathname === "/admin/billing",
    },
    {
      href: "/admin/reports",
      label: "Reports",
      icon: BarChart3,
      active: pathname === "/admin/reports",
    },
    {
      href: "/admin/audit-logs",
      label: "Audit Logs",
      icon: FileText,
      active: pathname === "/admin/audit-logs",
    },
    {
      href: "/admin/settings",
      label: "Settings",
      icon: Settings,
      active: pathname === "/admin/settings",
    },
  ]

  if (!isOpen) return null

  return (
    <div className="h-full flex flex-col">
      <div className="flex h-16 items-center border-b px-6 shrink-0">
        <Link href="/admin" className="flex items-center gap-2 font-semibold">
          <Shield className="h-6 w-6 text-primary" />
          <span className="text-lg">MembersHome Admin</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              route.active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <route.icon className="h-5 w-5" />
            {route.label}
          </Link>
        ))}
      </nav>

      <div className="border-t p-4 shrink-0">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <Home className="h-5 w-5" />
          Back to Site
        </Link>
        <Button
          variant="ghost"
          className="mt-2 w-full justify-start gap-3 text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}