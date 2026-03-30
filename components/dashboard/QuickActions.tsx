"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import {
  UserPlus,
  CalendarPlus,
  TicketPlus,
  Mail,
  BarChart3,
  Users,
} from "lucide-react"

interface QuickAction {
  label: string
  href: string
  icon: React.ReactNode
  variant?: "default" | "outline" | "secondary"
}

interface QuickActionsProps {
  actions?: QuickAction[]
  orgSlug?: string
  houseSlug?: string
  isHouse?: boolean
}

export function QuickActions({
  actions,
  orgSlug,
  houseSlug,
  isHouse = false,
}: QuickActionsProps) {
  const basePath =
    isHouse && orgSlug && houseSlug
      ? `/house/${orgSlug}/${houseSlug}`
      : orgSlug
      ? `/organization/${orgSlug}`
      : ""

  const defaultActions: QuickAction[] = [
    {
      label: "Invite Member",
      href: `${basePath}/people/invite`,
      icon: <UserPlus className="h-4 w-4" />,
      variant: "default",
    },
    {
      label: "Create Event",
      href: `${basePath}/events/create`,
      icon: <CalendarPlus className="h-4 w-4" />,
      variant: "outline",
    },
    {
      label: "Sell Tickets",
      href: `${basePath}/tickets/create`,
      icon: <TicketPlus className="h-4 w-4" />,
      variant: "outline",
    },
    {
      label: "Send Announcement",
      href: `${basePath}/communications/create`,
      icon: <Mail className="h-4 w-4" />,
      variant: "outline",
    },
    {
      label: "View Reports",
      href: `${basePath}/reports`,
      icon: <BarChart3 className="h-4 w-4" />,
      variant: "outline",
    },
    {
      label: "Manage Members",
      href: `${basePath}/people`,
      icon: <Users className="h-4 w-4" />,
      variant: "outline",
    },
  ]

  const displayActions = actions || defaultActions.filter((a) => a.href !== "")

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {displayActions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Button
                variant={action.variant || "outline"}
                className="w-full justify-start gap-2"
              >
                {action.icon}
                {action.label}
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}