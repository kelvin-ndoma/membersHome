"use client"

import { Badge } from "@/components/ui/Badge"
import { Crown, Shield, Star, User } from "lucide-react"

interface RoleBadgeProps {
  role: "HOUSE_MEMBER" | "HOUSE_STAFF" | "HOUSE_MANAGER" | "HOUSE_ADMIN"
  showIcon?: boolean
  size?: "sm" | "md"
}

export function RoleBadge({ role, showIcon = true, size = "sm" }: RoleBadgeProps) {
  const roleConfig = {
    HOUSE_ADMIN: {
      label: "Admin",
      icon: Crown,
      variant: "destructive" as const,
      className: "bg-red-100 text-red-800 hover:bg-red-200",
    },
    HOUSE_MANAGER: {
      label: "Manager",
      icon: Shield,
      variant: "default" as const,
      className: "bg-blue-100 text-blue-800 hover:bg-blue-200",
    },
    HOUSE_STAFF: {
      label: "Staff",
      icon: Star,
      variant: "secondary" as const,
      className: "bg-green-100 text-green-800 hover:bg-green-200",
    },
    HOUSE_MEMBER: {
      label: "Member",
      icon: User,
      variant: "outline" as const,
      className: "bg-gray-100 text-gray-800 hover:bg-gray-200",
    },
  }

  const config = roleConfig[role]
  const Icon = config.icon

  return (
    <Badge variant={config.variant} className={cn("gap-1", config.className, size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1")}>
      {showIcon && <Icon className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />}
      {config.label}
    </Badge>
  )
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}