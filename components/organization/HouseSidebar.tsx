// components/organization/HouseSidebar.tsx
"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  Calendar,
  Ticket,
  DollarSign,
  Settings,
  Home,
  CreditCard,
  ArrowLeft,
  FileText,
  ClipboardList,
} from "lucide-react"
import { Button } from "@/components/ui/Button"

interface House {
  id: string
  name: string
  slug: string
}

interface HouseSidebarProps {
  orgSlug: string
  house: House
  isOpen?: boolean
  onClose?: () => void
  onBackToOrg?: () => void
}

export function HouseSidebar({ orgSlug, house, isOpen = false, onClose, onBackToOrg }: HouseSidebarProps) {
  const pathname = usePathname()

  const houseRoutes = [
    {
      href: `/organization/${orgSlug}/houses/${house.slug}`,
      label: "House Dashboard",
      icon: LayoutDashboard,
      active: pathname === `/organization/${orgSlug}/houses/${house.slug}`,
    },
    {
      href: `/organization/${orgSlug}/houses/${house.slug}/members`,
      label: "Members",
      icon: Users,
      active: pathname === `/organization/${orgSlug}/houses/${house.slug}/members`,
    },
    {
      href: `/organization/${orgSlug}/houses/${house.slug}/membership-plans`,
      label: "Membership Plans",
      icon: DollarSign,
      active: pathname === `/organization/${orgSlug}/houses/${house.slug}/membership-plans`,
    },
    {
      href: `/organization/${orgSlug}/houses/${house.slug}/applications`,
      label: "Applications",
      icon: ClipboardList,
      active: pathname === `/organization/${orgSlug}/houses/${house.slug}/applications`,
    },
    {
      href: `/organization/${orgSlug}/houses/${house.slug}/events`,
      label: "Events",
      icon: Calendar,
      active: pathname === `/organization/${orgSlug}/houses/${house.slug}/events`,
    },
    {
      href: `/organization/${orgSlug}/houses/${house.slug}/tickets`,
      label: "Tickets",
      icon: Ticket,
      active: pathname === `/organization/${orgSlug}/houses/${house.slug}/tickets`,
    },
    {
      href: `/organization/${orgSlug}/houses/${house.slug}/billing`,
      label: "Billing",
      icon: CreditCard,
      active: pathname === `/organization/${orgSlug}/houses/${house.slug}/billing`,
    },
    {
      href: `/organization/${orgSlug}/houses/${house.slug}/forms`,
      label: "Forms",
      icon: FileText,
      active: pathname === `/organization/${orgSlug}/houses/${house.slug}/forms`,
    },
    {
      href: `/organization/${orgSlug}/houses/${house.slug}/settings`,
      label: "House Settings",
      icon: Settings,
      active: pathname === `/organization/${orgSlug}/houses/${house.slug}/settings`,
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
        <div className="flex items-center gap-2">
          <Home className="h-5 w-5 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Current House</p>
            <p className="text-sm font-semibold">{house.name}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onBackToOrg}
          title="Back to Organization"
          className="md:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </div>

      <div className="px-4 pt-4">
        <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
          House Management
        </h3>
        <nav className="space-y-1">
          {houseRoutes.map((route) => (
            <NavLink
              key={route.href}
              href={route.href}
              label={route.label}
              icon={route.icon}
              active={route.active}
            />
          ))}
        </nav>
      </div>

      {/* Back to Organization Button at bottom */}
      <div className="mt-auto p-4 border-t">
        <Button
          variant="outline"
          className="w-full"
          onClick={onBackToOrg}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Organization
        </Button>
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