"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"
import { Bell, Settings, User, ChevronDown, Home, HomeIcon } from "lucide-react"
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
import { RoleBadge } from "./RoleBadge"

interface HouseHeaderProps {
  orgSlug: string
  houseName: string
  houseSlug: string
  userRole: "HOUSE_MEMBER" | "HOUSE_STAFF" | "HOUSE_MANAGER" | "HOUSE_ADMIN"
  houseLogo?: string | null
}

export function HouseHeader({ 
  orgSlug, 
  houseName, 
  houseSlug, 
  userRole,
  houseLogo 
}: HouseHeaderProps) {
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
          <div className="flex items-center gap-2">
            {houseLogo ? (
              <img src={houseLogo} alt={houseName} className="h-8 w-8 rounded-full" />
            ) : (
              <HomeIcon className="h-5 w-5 text-primary" />
            )}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{houseName}</span>
                <RoleBadge role={userRole} />
              </div>
              <Link href={`/organization/${orgSlug}/dashboard`} className="text-xs text-muted-foreground hover:underline">
                {orgSlug}
              </Link>
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
                <Link href={`/house/${orgSlug}/${houseSlug}/profile`} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/organization/${orgSlug}/dashboard`} className="cursor-pointer">
                  <Home className="mr-2 h-4 w-4" />
                  Organization Dashboard
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
                <SignOutButton variant="ghost" size="sm" className="w-full justify-start p-0" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}