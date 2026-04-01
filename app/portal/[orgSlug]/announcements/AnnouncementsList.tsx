// app/portal/[orgSlug]/announcements/AnnouncementsList.tsx
"use client"

import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Bell, Home } from "lucide-react"

interface Announcement {
  id: string
  subject: string
  body: string
  sentAt: Date | null
  houseId: string | null
}

interface AnnouncementsListProps {
  announcements: Announcement[]
  houses: { id: string; name: string }[]
}

export function AnnouncementsList({ announcements, houses }: AnnouncementsListProps) {
  return (
    <div className="space-y-4">
      {announcements.map((announcement) => {
        const house = houses.find(h => h.id === announcement.houseId)
        
        return (
          <Card key={announcement.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{announcement.subject}</CardTitle>
                </div>
                {house && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Home className="h-3 w-3" />
                    {house.name}
                  </Badge>
                )}
              </div>
              {announcement.sentAt && (
                <p className="text-xs text-muted-foreground">
                  {format(new Date(announcement.sentAt), "MMMM d, yyyy • h:mm a")}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap">{announcement.body}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}