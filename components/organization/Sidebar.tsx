"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  Home,
  Calendar,
  ShoppingCart,
  CreditCard,
  Mail,
  BarChart3,
  Settings,
  LogOut,
  Ticket,
  UserCheck,
  X,
  Building2,
} from "lucide-react"
import { SignOutButton } from "@/components/auth/SignOutButton"

interface OrganizationSidebarProps {
  organizationSlug: string
  userRole?: string
  isOpen?: boolean
  onClose?: () => void
}

export function OrganizationSidebar({
  organizationSlug,
  userRole,
  isOpen = false,
  onClose,
}: OrganizationSidebarProps) {
  const pathname = usePathname()

  const isAdmin = userRole === "ORG_ADMIN" || userRole === "ORG_OWNER"

  const routes = [
    {
      href: `/organization/${organizationSlug}/dashboard`,
      label: "Dashboard",
      icon: LayoutDashboard,
      active: pathname === `/organization/${organizationSlug}/dashboard`,
    },
    {
      href: `/organization/${organizationSlug}/people`,
      label: "Members",
      icon: Users,
      active:
        pathname === `/organization/${organizationSlug}/people` ||
        pathname.startsWith(`/organization/${organizationSlug}/people/`),
    },
    {
      href: `/organization/${organizationSlug}/houses`,
      label: "Houses",
      icon: Home,
      active:
        pathname === `/organization/${organizationSlug}/houses` ||
        pathname.startsWith(`/organization/${organizationSlug}/houses/`),
    },
    {
      href: `/organization/${organizationSlug}/events`,
      label: "Events",
      icon: Calendar,
      active:
        pathname === `/organization/${organizationSlug}/events` ||
        pathname.startsWith(`/organization/${organizationSlug}/events/`),
    },
    {
      href: `/organization/${organizationSlug}/commerce`,
      label: "Commerce",
      icon: ShoppingCart,
      active:
        pathname === `/organization/${organizationSlug}/commerce` ||
        pathname.startsWith(`/organization/${organizationSlug}/commerce/`),
    },
    {
      href: `/organization/${organizationSlug}/memberships`,
      label: "Memberships",
      icon: UserCheck,
      active:
        pathname === `/organization/${organizationSlug}/memberships` ||
        pathname.startsWith(`/organization/${organizationSlug}/memberships/`),
    },
    {
      href: `/organization/${organizationSlug}/tickets`,
      label: "Tickets",
      icon: Ticket,
      active:
        pathname === `/organization/${organizationSlug}/tickets` ||
        pathname.startsWith(`/organization/${organizationSlug}/tickets/`),
    },
    {
      href: `/organization/${organizationSlug}/communications`,
      label: "Communications",
      icon: Mail,
      active:
        pathname === `/organization/${organizationSlug}/communications` ||
        pathname.startsWith(`/organization/${organizationSlug}/communications/`),
    },
    {
      href: `/organization/${organizationSlug}/reports`,
      label: "Reports",
      icon: BarChart3,
      active:
        pathname === `/organization/${organizationSlug}/reports` ||
        pathname.startsWith(`/organization/${organizationSlug}/reports/`),
    },
  ]

  const bottomRoutes = [
    {
      href: `/organization/${organizationSlug}/billing`,
      label: "Billing",
      icon: CreditCard,
      active:
        pathname === `/organization/${organizationSlug}/billing` ||
        pathname.startsWith(`/organization/${organizationSlug}/billing/`),
      show: isAdmin,
    },
    {
      href: `/organization/${organizationSlug}/settings`,
      label: "Settings",
      icon: Settings,
      active:
        pathname === `/organization/${organizationSlug}/settings` ||
        pathname.startsWith(`/organization/${organizationSlug}/settings/`),
      show: isAdmin,
    },
  ]

  const NavLink = ({
    href,
    label,
    icon: Icon,
    active,
  }: {
    href: string
    label: string
    icon: any
    active: boolean
  }) => (
    <Link
      href={href}
      onClick={onClose}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span>{label}</span>
    </Link>
  )

  const sidebarContent = (
    <div className="flex h-full flex-col bg-background">
      <div className="flex h-16 items-center justify-between border-b px-4">
        <Link
          href={`/organization/${organizationSlug}/dashboard`}
          className="flex items-center gap-2 font-semibold"
          onClick={onClose}
        >
          <Building2 className="h-5 w-5 text-primary" />
          <span className="text-lg">MembersHome</span>
        </Link>

        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground md:hidden"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {routes.map((route) => (
          <NavLink
            key={route.href}
            href={route.href}
            label={route.label}
            icon={route.icon}
            active={route.active}
          />
        ))}

        {bottomRoutes.some((route) => route.show !== false) && (
          <>
            <div className="my-4 border-t" />
            {bottomRoutes
              .filter((route) => route.show !== false)
              .map((route) => (
                <NavLink
                  key={route.href}
                  href={route.href}
                  label={route.label}
                  icon={route.icon}
                  active={route.active}
                />
              ))}
          </>
        )}
      </nav>

      <div className="border-t p-4">
        <Link
          href="/"
          onClick={onClose}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <LogOut className="h-5 w-5" />
          Back to Site
        </Link>

        <SignOutButton
          variant="ghost"
          className="mt-2 w-full justify-start gap-3 text-red-600 hover:bg-red-50 hover:text-red-700"
        />
      </div>
    </div>
  )

  return (
    <>
      <aside className="hidden h-screen w-64 shrink-0 border-r bg-background md:block">
        {sidebarContent}
      </aside>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={onClose}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r bg-background md:hidden">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  )
}