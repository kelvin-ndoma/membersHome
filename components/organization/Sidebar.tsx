// components/organization/Sidebar.tsx
"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Settings,
  LogOut,
  X,
  Home,
  ChevronDown,
} from "lucide-react"
import { SignOutButton } from "@/components/auth/SignOutButton"
import { Button } from "@/components/ui/Button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/Dropdown"

interface House {
  id: string
  name: string
  slug: string
}

interface OrganizationSidebarProps {
  organizationSlug: string
  userRole?: string
  isAdmin?: boolean
  isOpen?: boolean
  onClose?: () => void
  allHouses?: House[]
  selectedHouse?: House | null
  onHouseSelect?: (house: House) => void
}

export function OrganizationSidebar({
  organizationSlug,
  userRole,
  isAdmin = false,
  isOpen = false,
  onClose,
  allHouses = [],
  selectedHouse,
  onHouseSelect,
}: OrganizationSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const orgRoutes = [
    {
      href: `/organization/${organizationSlug}/dashboard`,
      label: "Organization Dashboard",
      icon: LayoutDashboard,
      active: pathname === `/organization/${organizationSlug}/dashboard`,
    },
    {
      href: `/organization/${organizationSlug}/billing`,
      label: "Billing",
      icon: CreditCard,
      active: pathname === `/organization/${organizationSlug}/billing`,
      show: isAdmin,
    },
    {
      href: `/organization/${organizationSlug}/settings`,
      label: "Organization Settings",
      icon: Settings,
      active: pathname === `/organization/${organizationSlug}/settings`,
      show: isAdmin,
    },
  ]

  const handleHouseClick = (house: House) => {
    if (onHouseSelect) {
      onHouseSelect(house)
    } else {
      router.push(`/organization/${organizationSlug}/houses/${house.slug}`)
    }
    if (onClose) onClose()
  }

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
      {/* Header with Logo and House Dropdown */}
      <div className="border-b px-4 py-4 space-y-3">
        <Link
          href={`/organization/${organizationSlug}/dashboard`}
          className="flex items-center gap-2 font-semibold"
          onClick={onClose}
        >
          <Building2 className="h-5 w-5 text-primary" />
          <span className="text-lg">MembersHome</span>
        </Link>
        
        {/* House Selector Dropdown - Directly below the logo */}
        {allHouses.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full justify-between mt-2"
              >
                <span className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  {selectedHouse?.name || "Select a house"}
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Switch to House</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {allHouses.map((house) => (
                <DropdownMenuItem
                  key={house.id}
                  onClick={() => handleHouseClick(house)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{house.name}</span>
                    {selectedHouse?.id === house.id && (
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground md:hidden absolute right-2 top-4"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <div className="px-4 pt-4">
        <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
          Organization
        </h3>
        <nav className="space-y-1">
          {orgRoutes
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
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="mt-auto">
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