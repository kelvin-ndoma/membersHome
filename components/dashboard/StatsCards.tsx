"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Users, Building2, Calendar, Ticket, DollarSign, Activity } from "lucide-react"

interface Stat {
  title: string
  value: string | number
  icon: React.ReactNode
  change?: string
  trend?: "up" | "down"
  color?: string
}

interface StatsCardsProps {
  stats: Stat[]
  className?: string
}

export function StatsCards({ stats, className }: StatsCardsProps) {
  const defaultStats: Stat[] = [
    {
      title: "Total Members",
      value: "0",
      icon: <Users className="h-4 w-4" />,
      change: "0%",
      trend: "up",
    },
    {
      title: "Active Houses",
      value: "0",
      icon: <Building2 className="h-4 w-4" />,
    },
    {
      title: "Upcoming Events",
      value: "0",
      icon: <Calendar className="h-4 w-4" />,
    },
    {
      title: "Tickets Sold",
      value: "0",
      icon: <Ticket className="h-4 w-4" />,
      change: "0%",
      trend: "up",
    },
    {
      title: "Revenue",
      value: "$0",
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      title: "Active Members",
      value: "0",
      icon: <Activity className="h-4 w-4" />,
    },
  ]

  const displayStats = stats.length > 0 ? stats : defaultStats

  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-3", className)}>
      {displayStats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <div className={cn("h-4 w-4 text-muted-foreground", stat.color)}>
              {stat.icon}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            {stat.change && (
              <p className={cn(
                "text-xs",
                stat.trend === "up" ? "text-green-600" : "text-red-600"
              )}>
                {stat.trend === "up" ? "↑" : "↓"} {stat.change} from last month
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}