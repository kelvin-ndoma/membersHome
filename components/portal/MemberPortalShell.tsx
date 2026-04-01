"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar"
import {
  LayoutDashboard,
  Calendar,
  Ticket,
  Mail,
  CreditCard,
  User,
  LogOut,
  Home,
  Menu,
  X,
  Bell,
  Users,
} from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/Dropdown"

interface Organization {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  primaryColor: string | null
}

interface MemberPortalShellProps {
  children: React.ReactNode
  organization: Organization
  membership: {
    id: string
    organizationRole: string
    status: string
  }
  membershipItem: {
    id: string
    status: string
    membershipPlan?: {
      name: string
    }
    billingFrequency?: string
  } | null
}

export function MemberPortalShell({
  children,
  organization,
  membership,
  membershipItem,
}: MemberPortalShellProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navItems = [
    {
      href: `/portal/${organization.slug}/dashboard`,
      label: "Dashboard",
      icon: LayoutDashboard,
      active: pathname === `/portal/${organization.slug}/dashboard`,
    },
    {
      href: `/portal/${organization.slug}/events`,
      label: "Events",
      icon: Calendar,
      active: pathname.startsWith(`/portal/${organization.slug}/events`),
    },
    {
      href: `/portal/${organization.slug}/tickets`,
      label: "My Tickets",
      icon: Ticket,
      active: pathname === `/portal/${organization.slug}/tickets`,
    },
    {
      href: `/portal/${organization.slug}/announcements`,
      label: "Announcements",
      icon: Mail,
      active: pathname === `/portal/${organization.slug}/announcements`,
    },
    {
      href: `/portal/${organization.slug}/billing`,
      label: "Billing",
      icon: CreditCard,
      active: pathname === `/portal/${organization.slug}/billing`,
    },
    {
      href: `/portal/${organization.slug}/profile`,
      label: "My Profile",
      icon: User,
      active: pathname === `/portal/${organization.slug}/profile`,
    },
  ]

  const userInitials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U"

  return (
    <div className="flex h-screen overflow-hidden bg-muted/10">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform border-r bg-background transition-transform duration-200 ease-in-out md:relative md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center border-b px-6">
            {organization.logoUrl ? (
              <img
                src={organization.logoUrl}
                alt={organization.name}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <span className="text-sm font-bold text-primary">
                  {organization.name.charAt(0)}
                </span>
              </div>
            )}
            <span className="ml-2 font-semibold">{organization.name}</span>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  item.active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="border-t p-4">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Home className="h-5 w-5" />
              Back to Home
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="mt-2 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b bg-background">
          <div className="flex h-16 items-center justify-between px-4 md:px-6">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex-1" />

            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={session?.user?.image || ""} />
                      <AvatarFallback>{userInitials}</AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline-block">
                      {session?.user?.name || "Member"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`/portal/${organization.slug}/profile`}>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/portal/${organization.slug}/billing`}>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Billing
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}