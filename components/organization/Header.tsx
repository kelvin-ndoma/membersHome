"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Bell,
  Settings,
  User,
  ChevronDown,
  Home,
  Building2,
  Menu,
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

interface OrganizationHeaderProps {
  organizationName: string
  organizationSlug: string
  organizationLogo?: string | null
  onMenuClick?: () => void
}

export function OrganizationHeader({
  organizationName,
  organizationSlug,
  organizationLogo,
  onMenuClick,
}: OrganizationHeaderProps) {
  const { data: session } = useSession()
  const pathname = usePathname()

  const getPageTitle = () => {
    if (pathname === `/organization/${organizationSlug}/dashboard`) return "Dashboard"
    if (pathname === `/organization/${organizationSlug}/people`) return "Members"
    if (pathname === `/organization/${organizationSlug}/houses`) return "Houses"
    if (pathname === `/organization/${organizationSlug}/events`) return "Events"
    if (pathname === `/organization/${organizationSlug}/commerce`) return "Commerce"
    if (pathname === `/organization/${organizationSlug}/memberships`) return "Memberships"
    if (pathname === `/organization/${organizationSlug}/communications`) return "Communications"
    if (pathname === `/organization/${organizationSlug}/reports`) return "Reports"
    if (pathname === `/organization/${organizationSlug}/billing`) return "Billing"
    if (pathname === `/organization/${organizationSlug}/settings`) return "Settings"
    if (pathname === `/organization/${organizationSlug}/profile`) return "Profile"
    return "Organization"
  }

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

          <div className="flex items-center gap-2">
            {organizationLogo ? (
              <img
                src={organizationLogo}
                alt={organizationName}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <Building2 className="h-5 w-5 text-primary" />
            )}

            <div className="hidden flex-col md:flex">
              <span className="text-sm font-medium">{organizationName}</span>
              <span className="text-xs text-muted-foreground">
                {getPageTitle()}
              </span>
            </div>

            <div className="flex flex-col md:hidden">
              <span className="text-sm font-medium">{getPageTitle()}</span>
            </div>
          </div>
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