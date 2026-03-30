"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Progress } from "@/components/ui/Progress"
import { Mail, Eye, MousePointer, Clock } from "lucide-react"
import { format } from "date-fns"

interface EmailStatsProps {
  stats: {
    sent: number
    opened: number
    clicked: number
    openRate: number
    clickRate: number
    bounceRate: number
  }
  recentEmails: Array<{
    id: string
    subject: string
    sentAt: Date
    sentCount: number
    openedCount: number
    clickedCount: number
  }>
}

export function EmailStats({ stats, recentEmails }: EmailStatsProps) {
  const statCards = [
    {
      title: "Sent",
      value: stats.sent.toLocaleString(),
      icon: Mail,
      color: "text-blue-500",
    },
    {
      title: "Opened",
      value: stats.opened.toLocaleString(),
      icon: Eye,
      color: "text-green-500",
      rate: `${stats.openRate}% open rate`,
    },
    {
      title: "Clicked",
      value: stats.clicked.toLocaleString(),
      icon: MousePointer,
      color: "text-purple-500",
      rate: `${stats.clickRate}% click rate`,
    },
    {
      title: "Bounced",
      value: stats.bounceRate.toFixed(1),
      icon: Clock,
      color: "text-red-500",
      rate: `${stats.bounceRate}% bounce rate`,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.rate && (
                <p className="text-xs text-muted-foreground">{stat.rate}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Engagement Rates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Open Rate</span>
                <span>{stats.openRate}%</span>
              </div>
              <Progress value={stats.openRate} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Click Rate</span>
                <span>{stats.clickRate}%</span>
              </div>
              <Progress value={stats.clickRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            {recentEmails.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Mail className="h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">No recent campaigns</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentEmails.map((email) => (
                  <div key={email.id} className="rounded-lg border p-3">
                    <p className="font-medium truncate">{email.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      Sent {format(new Date(email.sentAt), "MMM d, yyyy")}
                    </p>
                    <div className="mt-2 flex gap-4 text-xs">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {email.sentCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {email.openedCount} ({((email.openedCount / email.sentCount) * 100).toFixed(0)}%)
                      </span>
                      <span className="flex items-center gap-1">
                        <MousePointer className="h-3 w-3" />
                        {email.clickedCount} ({((email.clickedCount / email.sentCount) * 100).toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}