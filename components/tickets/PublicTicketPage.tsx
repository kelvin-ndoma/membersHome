"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { TicketPurchaseModal } from "./TicketPurchaseModal"
import { Calendar, MapPin, Users, DollarSign, Clock } from "lucide-react"
import { format } from "date-fns"

interface PublicTicketPageProps {
  ticket: {
    id: string
    name: string
    description: string | null
    price: number
    currency: string
    memberPrice: number | null
    availableQuantity: number
    maxPerPurchase: number
    salesStartAt: Date
    salesEndAt: Date
    validFrom: Date
    validUntil: Date
    memberOnly: boolean
    event?: {
      title: string
      startDate: Date
      endDate: Date
      location: string | null
    } | null
    houseName?: string
    organizationName?: string
  }
  isMember?: boolean
  onPurchase: (data: { quantity: number; customerName: string; customerEmail: string; customerPhone?: string }) => Promise<void>
}

export function PublicTicketPage({ ticket, isMember = false, onPurchase }: PublicTicketPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const isAvailable = new Date() >= ticket.salesStartAt && 
    new Date() <= ticket.salesEndAt && 
    ticket.availableQuantity > 0

  const unitPrice = isMember && ticket.memberPrice ? ticket.memberPrice : ticket.price

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto max-w-4xl py-12">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">{ticket.name}</CardTitle>
            {ticket.event && (
              <CardDescription className="text-lg">
                {ticket.event.title}
              </CardDescription>
            )}
            <div className="mt-2 flex justify-center gap-2">
              {ticket.memberOnly && <Badge variant="destructive">Members Only</Badge>}
              {ticket.memberPrice && <Badge variant="success">Member Pricing Available</Badge>}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {ticket.event && (
              <div className="grid gap-4 rounded-lg bg-muted p-4 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <span>
                    {format(new Date(ticket.event.startDate), "MMMM d, yyyy")}
                  </span>
                </div>
                {ticket.event.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <span>{ticket.event.location}</span>
                  </div>
                )}
              </div>
            )}

            {ticket.description && (
              <div>
                <h3 className="mb-2 font-semibold">About this ticket</h3>
                <p className="text-muted-foreground">{ticket.description}</p>
              </div>
            )}

            <div className="grid gap-4 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  <span className="text-2xl font-bold">
                    {ticket.currency} {unitPrice}
                  </span>
                  {isMember && ticket.memberPrice && (
                    <span className="text-sm line-through text-muted-foreground">
                      {ticket.currency} {ticket.price}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{ticket.availableQuantity} available</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  Sales end {format(new Date(ticket.salesEndAt), "MMMM d, yyyy")}
                </span>
              </div>

              <Button 
                size="lg" 
                className="w-full"
                disabled={!isAvailable || (ticket.memberOnly && !isMember)}
                onClick={() => setIsModalOpen(true)}
              >
                {!isAvailable 
                  ? "Not Available" 
                  : ticket.memberOnly && !isMember 
                    ? "Members Only" 
                    : "Purchase Ticket"}
              </Button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>Powered by {ticket.organizationName || "MembersHome"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <TicketPurchaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        ticket={ticket}
        isMember={isMember}
        onConfirm={onPurchase}
      />
    </div>
  )
}