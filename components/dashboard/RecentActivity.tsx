"use client"

import { formatDistanceToNow } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar"
import { Badge } from "@/components/ui/Badge"
import { 
  UserPlus, 
  Calendar, 
  Ticket, 
  CreditCard, 
  Mail,
  Users
} from "lucide-react"

interface Activity {
  id: string
  type: "member_joined" | "event_created" | "ticket_purchased" | "payment_received" | "announcement_sent" | "member_left"
  user: {
    name: string
    email: string
    image?: string
  }
  description: string
  createdAt: Date
  metadata?: any
}

interface RecentActivityProps {
  activities: Activity[]
  className?: string
}

export function RecentActivity({ activities, className }: RecentActivityProps) {
  const getActivityIcon = (type: Activity["type"]) => {
    switch (type) {
      case "member_joined":
        return <UserPlus className="h-4 w-4 text-green-600" />
      case "event_created":
        return <Calendar className="h-4 w-4 text-blue-600" />
      case "ticket_purchased":
        return <Ticket className="h-4 w-4 text-purple-600" />
      case "payment_received":
        return <CreditCard className="h-4 w-4 text-emerald-600" />
      case "announcement_sent":
        return <Mail className="h-4 w-4 text-orange-600" />
      case "member_left":
        return <Users className="h-4 w-4 text-red-600" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  const getActivityBadge = (type: Activity["type"]) => {
    const variants: Record<Activity["type"], string> = {
      member_joined: "bg-green-100 text-green-800",
      event_created: "bg-blue-100 text-blue-800",
      ticket_purchased: "bg-purple-100 text-purple-800",
      payment_received: "bg-emerald-100 text-emerald-800",
      announcement_sent: "bg-orange-100 text-orange-800",
      member_left: "bg-red-100 text-red-800",
    }
    return variants[type] || "bg-gray-100 text-gray-800"
  }

  const getActivityLabel = (type: Activity["type"]) => {
    const labels: Record<Activity["type"], string> = {
      member_joined: "New Member",
      event_created: "Event Created",
      ticket_purchased: "Ticket Purchase",
      payment_received: "Payment",
      announcement_sent: "Announcement",
      member_left: "Member Left",
    }
    return labels[type] || "Activity"
  }

  const emptyState = (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Users className="h-12 w-12 text-muted-foreground" />
      <p className="mt-2 text-sm text-muted-foreground">No recent activity</p>
    </div>
  )

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          emptyState
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={activity.user.image} />
                  <AvatarFallback>
                    {activity.user.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{activity.user.name}</span>
                    <Badge className={getActivityBadge(activity.type)}>
                      {getActivityLabel(activity.type)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}</span>
                    {activity.metadata?.quantity && (
                      <span>• Quantity: {activity.metadata.quantity}</span>
                    )}
                    {activity.metadata?.amount && (
                      <span>• ${activity.metadata.amount}</span>
                    )}
                  </div>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  {getActivityIcon(activity.type)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}