"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, Bell, User, LogOut, Settings, ChevronDown } from "lucide-react"
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

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { data: session } = useSession()
  const pathname = usePathname()

  const getPageTitle = () => {
    if (pathname === "/admin") return "Dashboard"
    if (pathname === "/admin/organizations") return "Organizations"
    if (pathname === "/admin/users") return "Users"
    if (pathname === "/admin/tickets") return "Tickets"
    if (pathname === "/admin/billing") return "Billing"
    if (pathname === "/admin/audit-logs") return "Audit Logs"
    if (pathname === "/admin/reports") return "Reports"
    if (pathname === "/admin/settings") return "Settings"
    if (pathname.startsWith("/admin/organizations/")) return "Organization Details"
    if (pathname.startsWith("/admin/users/")) return "User Details"
    return "Admin Panel"
  }

  const userInitials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AD"

  return (
    <header className="h-16 border-b bg-background">
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold md:text-xl">{getPageTitle()}</h1>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session?.user?.image || ""} />
                  <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
                <span className="hidden md:inline-block">
                  {session?.user?.name || "Admin"}
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  View Site
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/" })}
                className="cursor-pointer text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}