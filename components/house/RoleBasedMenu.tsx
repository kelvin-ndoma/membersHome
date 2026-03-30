"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface MenuItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  roles: string[]
}

interface RoleBasedMenuProps {
  items: MenuItem[]
  userRole: string
  basePath: string
  className?: string
}

export function RoleBasedMenu({ items, userRole, basePath, className }: RoleBasedMenuProps) {
  const pathname = usePathname()

  const accessibleItems = items.filter(item => item.roles.includes(userRole))

  if (accessibleItems.length === 0) {
    return null
  }

  return (
    <div className={cn("space-y-1", className)}>
      {accessibleItems.map((item) => {
        const href = `${basePath}${item.href}`
        const isActive = pathname === href || pathname.startsWith(`${href}/`)
        
        return (
          <Link
            key={item.href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        )
      })}
    </div>
  )
}