"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Ticket, Users, Calendar, DollarSign, Clock } from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"

interface TicketCardProps {
  ticket: {
    id: string
    name: string
    description: string | null
    type: string
    price: number
    currency: string
    totalQuantity: number
    soldQuantity: number
    availableQuantity: number
    salesStartAt: Date
    salesEndAt: Date
    memberOnly: boolean
    status: string
  }
  onPurchase?: (ticketId: string) => void
  onEdit?: (ticketId: string) => void
  showActions?: boolean
}

export function TicketCard({ ticket, onPurchase, onEdit, showActions = true }: TicketCardProps) {
  const [isLoading, setIsLoading] = useState(false)

  const isAvailable = ticket.status === "ACTIVE" && 
    new Date() >= new Date(ticket.salesStartAt) && 
    new Date() <= new Date(ticket.salesEndAt) &&
    ticket.availableQuantity > 0

  const getStatusBadge = () => {
    if (ticket.status === "DRAFT") return <Badge variant="outline">Draft</Badge>
    if (ticket.status === "ACTIVE") return <Badge variant="success">Active</Badge>
    if (ticket.status === "SOLD_OUT") return <Badge variant="warning">Sold Out</Badge>
    if (ticket.status === "CANCELLED") return <Badge variant="destructive">Cancelled</Badge>
    if (ticket.status === "EXPIRED") return <Badge variant="secondary">Expired</Badge>
    return <Badge>{ticket.status}</Badge>
  }

  const getTypeIcon = () => {
    switch (ticket.type) {
      case "VIP":
        return <Badge variant="destructive">VIP</Badge>
      case "EARLY_BIRD":
        return <Badge variant="success">Early Bird</Badge>
      case "GROUP":
        return <Badge variant="secondary">Group</Badge>
      default:
        return <Badge variant="outline">General</Badge>
    }
  }

  return (
    <Card className="relative overflow-hidden">
      {ticket.memberOnly && (
        <div className="absolute right-0 top-0">
          <Badge className="rounded-l-none rounded-r-sm bg-blue-500">Members Only</Badge>
        </div>
      )}
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">{ticket.name}</CardTitle>
            <CardDescription className="mt-1">{ticket.description}</CardDescription>
          </div>
          <div className="flex gap-1">
            {getTypeIcon()}
            {getStatusBadge()}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>{ticket.currency} {ticket.price}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Ticket className="h-4 w-4" />
              <span>{ticket.availableQuantity} / {ticket.totalQuantity} available</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Sales: {format(new Date(ticket.salesStartAt), "MMM d")} - {format(new Date(ticket.salesEndAt), "MMM d")}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{ticket.soldQuantity} sold</span>
            </div>
          </div>
          {new Date(ticket.salesStartAt) > new Date() && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Starts {formatDistanceToNow(new Date(ticket.salesStartAt), { addSuffix: true })}</span>
            </div>
          )}
          {new Date(ticket.salesEndAt) < new Date() && ticket.status === "ACTIVE" && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <Clock className="h-4 w-4" />
              <span>Sales ended {formatDistanceToNow(new Date(ticket.salesEndAt), { addSuffix: true })}</span>
            </div>
          )}
        </div>
      </CardContent>
      {showActions && (
        <CardFooter className="flex gap-2">
          {isAvailable && onPurchase && (
            <Button 
              className="flex-1" 
              onClick={() => onPurchase(ticket.id)}
              disabled={isLoading}
            >
              Purchase Ticket
            </Button>
          )}
          {onEdit && (
            <Button variant="outline" onClick={() => onEdit(ticket.id)}>
              Edit
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  )
}