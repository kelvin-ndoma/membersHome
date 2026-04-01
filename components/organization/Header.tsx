// components/organization/Header.tsx
"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import {
  Bell,
  Settings,
  User,
  ChevronDown,
  Home,
  Building2,
  Menu,
  ArrowLeft,
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/Dropdown"
import { SignOutButton } from "@/components/auth/SignOutButton"

interface House {
  id: string
  name: string
  slug: string
}

interface OrganizationHeaderProps {
  organizationName: string
  organizationSlug: string
  organizationLogo?: string | null
  onMenuClick?: () => void
  selectedHouse?: House | null
  onBackToOrg?: () => void
}

export function OrganizationHeader({
  organizationName,
  organizationSlug,
  organizationLogo,
  onMenuClick,
  selectedHouse,
  onBackToOrg,
}: OrganizationHeaderProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  const userInitials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U"

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {selectedHouse ? (
            // House view - show back button and house name
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={onBackToOrg}
                title="Back to Organization"
                className="hidden md:flex"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Link href={`/organization/${organizationSlug}/dashboard`} className="flex items-center gap-2">
                {organizationLogo ? (
                  <img
                    src={organizationLogo}
                    alt={organizationName}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <Building2 className="h-5 w-5 text-primary" />
                )}
                <span className="text-sm font-medium hidden md:inline-block">
                  {organizationName}
                </span>
              </Link>
              <span className="text-muted-foreground hidden md:block">/</span>
              <span className="text-sm font-medium">{selectedHouse.name}</span>
            </div>
          ) : (
            // Org view - just show organization name
            <Link href={`/organization/${organizationSlug}/dashboard`} className="flex items-center gap-2">
              {organizationLogo ? (
                <img
                  src={organizationLogo}
                  alt={organizationName}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <Building2 className="h-5 w-5 text-primary" />
              )}
              <span className="text-sm font-medium hidden md:inline-block">
                {organizationName}
              </span>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2 md:gap-4">
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
                  {session?.user?.name || "User"}
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <Link
                  href={`/organization/${organizationSlug}/profile`}
                  className="cursor-pointer"
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link
                  href={`/organization/${organizationSlug}/settings`}
                  className="cursor-pointer"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href="/" className="cursor-pointer">
                  <Home className="mr-2 h-4 w-4" />
                  Back to Site
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem asChild className="text-red-600">
                <SignOutButton
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start p-0"
                />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}