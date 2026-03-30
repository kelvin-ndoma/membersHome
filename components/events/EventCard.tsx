"use client"

import { format } from "date-fns"
import { Calendar, MapPin, Users, Ticket, MoreHorizontal } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/Dropdown"

interface EventCardProps {
  event: {
    id: string
    title: string
    description: string | null
    startDate: Date
    endDate: Date
    location: string | null
    type: string
    status: string
    capacity: number | null
    _count?: {
      rsvps: number
      tickets: number
    }
  }
  onView?: (eventId: string) => void
  onEdit?: (eventId: string) => void
  onManage?: (eventId: string) => void
  showActions?: boolean
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  PUBLISHED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  COMPLETED: "bg-blue-100 text-blue-800",
}

export function EventCard({ event, onView, onEdit, onManage, showActions = true }: EventCardProps) {
  const isUpcoming = new Date(event.startDate) > new Date()
  const isPast = new Date(event.endDate) < new Date()

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl">{event.title}</CardTitle>
            <CardDescription className="line-clamp-2">
              {event.description || "No description"}
            </CardDescription>
          </div>
          <Badge className={statusColors[event.status]}>
            {event.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            {format(new Date(event.startDate), "MMM d, yyyy • h:mm a")}
          </span>
        </div>
        {event.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{event.location}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{event._count?.rsvps || 0} attending</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Ticket className="h-4 w-4" />
              <span>{event._count?.tickets || 0} tickets</span>
            </div>
          </div>
          {event.capacity && (
            <Badge variant="outline">
              {event._count?.rsvps || 0}/{event.capacity} capacity
            </Badge>
          )}
        </div>
        {isUpcoming && event.status === "PUBLISHED" && (
          <div className="rounded-md bg-green-50 p-2 text-center text-xs text-green-700">
            Upcoming event
          </div>
        )}
        {isPast && (
          <div className="rounded-md bg-gray-50 p-2 text-center text-xs text-gray-600">
            Past event
          </div>
        )}
      </CardContent>
      {showActions && (
        <CardFooter className="flex gap-2">
          {onView && (
            <Button variant="outline" className="flex-1" onClick={() => onView(event.id)}>
              View Details
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(event.id)}>
                  Edit Event
                </DropdownMenuItem>
              )}
              {onManage && (
                <DropdownMenuItem onClick={() => onManage(event.id)}>
                  Manage Event
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardFooter>
      )}
    </Card>
  )
}