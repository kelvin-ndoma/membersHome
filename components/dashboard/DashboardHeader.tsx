"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"
import { Bell, Settings, User, LogOut, ChevronDown, Home, HomeIcon } from "lucide-react"
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

interface DashboardHeaderProps {
  organizationName?: string
  organizationSlug?: string
  houseName?: string  // Add this
  showBackToSite?: boolean
}

export function DashboardHeader({ 
  organizationName, 
  organizationSlug,
  houseName,
  showBackToSite = true 
}: DashboardHeaderProps) {
  const { data: session } = useSession()

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
          <Link href={organizationSlug ? `/organization/${organizationSlug}/dashboard` : "/"} className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary">MembersHome</span>
            {organizationName && (
              <>
                <span className="text-muted-foreground">/</span>
                <span className="text-sm font-medium">{organizationName}</span>
              </>
            )}
            {houseName && (
              <>
                <span className="text-muted-foreground">/</span>
                <span className="text-sm text-muted-foreground">{houseName}</span>
              </>
            )}
          </Link>

          {/* House badge */}
          {houseName && (
            <div className="hidden items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary md:flex">
              <HomeIcon className="h-3.5 w-3.5" />
              <span>{houseName}</span>
            </div>
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
                <Link href={organizationSlug ? `/organization/${organizationSlug}/profile` : "/profile"} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={organizationSlug ? `/organization/${organizationSlug}/settings` : "/settings"} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              {showBackToSite && (
                <DropdownMenuItem asChild>
                  <Link href="/" className="cursor-pointer">
                    <Home className="mr-2 h-4 w-4" />
                    Back to Site
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="text-red-600">
                <SignOutButton variant="ghost" size="sm" className="w-full justify-start p-0" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}