"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Progress } from "@/components/ui/Progress"
import { Users, UserCheck, UserX, TrendingUp, Calendar, Activity } from "lucide-react"
import { format } from "date-fns"

interface MembershipStats {
  total: number
  active: number
  pending: number
  paused: number
  banned: number
  newThisMonth: number
  activePercentage: number
  growthRate: number
}

interface RecentActivity {
  id: string
  user: { name: string; email: string }
  action: string
  createdAt: Date
}

interface MembershipsDashboardProps {
  stats: MembershipStats
  recentActivities: RecentActivity[]
  onViewAllMembers?: () => void
  onInviteMember?: () => void
}

export function MembershipsDashboard({
  stats,
  recentActivities,
  onViewAllMembers,
  onInviteMember,
}: MembershipsDashboardProps) {
  const statCards = [
    {
      title: "Total Members",
      value: stats.total,
      icon: Users,
      color: "bg-blue-500",
      trend: `${stats.growthRate}% growth`,
    },
    {
      title: "Active Members",
      value: stats.active,
      icon: UserCheck,
      color: "bg-green-500",
      subtext: `${stats.activePercentage}% of total`,
    },
    {
      title: "Pending Invites",
      value: stats.pending,
      icon: UserX,
      color: "bg-yellow-500",
    },
    {
      title: "New This Month",
      value: stats.newThisMonth,
      icon: TrendingUp,
      color: "bg-purple-500",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 text-${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.trend && (
                <p className="text-xs text-muted-foreground">{stat.trend}</p>
              )}
              {stat.subtext && (
                <p className="text-xs text-muted-foreground">{stat.subtext}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Membership Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Active</span>
                <span>{stats.active} / {stats.total}</span>
              </div>
              <Progress value={stats.activePercentage} className="h-2" />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-xl font-semibold">{stats.pending}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Paused</p>
                <p className="text-xl font-semibold">{stats.paused}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Banned</p>
                <p className="text-xl font-semibold">{stats.banned}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Active Rate</p>
                <p className="text-xl font-semibold">{stats.activePercentage}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            {onViewAllMembers && (
              <Button variant="ghost" size="sm" onClick={onViewAllMembers}>
                View All
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {recentActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Activity className="h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{activity.user.name}</span>{" "}
                        {activity.action}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(activity.createdAt), "MMM d, yyyy • h:mm a")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {onInviteMember && (
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="font-medium">Invite new members</p>
              <p className="text-sm text-muted-foreground">
                Send invitations to join your organization
              </p>
            </div>
            <Button onClick={onInviteMember}>Invite Member</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}