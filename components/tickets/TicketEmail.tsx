"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { QRCodeComponent } from "@/components/ui/QRCode"
import { Button } from "@/components/ui/Button"
import { Download, Mail } from "lucide-react"

interface TicketEmailProps {
  ticket: {
    name: string
    ticketCodes: string[]
    quantity: number
    totalAmount: number
    currency: string
    eventName?: string
    eventDate?: Date
    eventLocation?: string
  }
  qrCodeData?: string
  onDownload?: () => void
  onSendEmail?: () => void
}

export function TicketEmail({ ticket, qrCodeData, onDownload, onSendEmail }: TicketEmailProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Tickets</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg bg-green-50 p-4 text-center">
          <p className="text-lg font-semibold text-green-800">
            Purchase Confirmed!
          </p>
          <p className="text-sm text-green-700">
            Thank you for your purchase
          </p>
        </div>

        <div>
          <p className="font-semibold">{ticket.name}</p>
          {ticket.eventName && (
            <p className="text-sm text-muted-foreground">{ticket.eventName}</p>
          )}
          {ticket.eventDate && (
            <p className="text-sm text-muted-foreground">
              {new Date(ticket.eventDate).toLocaleDateString()} at {new Date(ticket.eventDate).toLocaleTimeString()}
            </p>
          )}
          {ticket.eventLocation && (
            <p className="text-sm text-muted-foreground">{ticket.eventLocation}</p>
          )}
        </div>

        <div className="rounded-lg bg-muted p-4">
          <div className="flex justify-between">
            <span>Quantity:</span>
            <span>{ticket.quantity}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Total:</span>
            <span>{ticket.currency} {ticket.totalAmount}</span>
          </div>
        </div>

        {qrCodeData && (
          <div className="flex flex-col items-center">
            <QRCodeComponent value={qrCodeData} size={150} />
            <p className="mt-2 text-xs text-muted-foreground">
              Scan this QR code at the entrance
            </p>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm font-semibold">Ticket Codes:</p>
          {ticket.ticketCodes.map((code, index) => (
            <div key={index} className="rounded-md bg-muted p-2 font-mono text-sm">
              {code}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          {onDownload && (
            <Button variant="outline" className="flex-1" onClick={onDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          )}
          {onSendEmail && (
            <Button className="flex-1" onClick={onSendEmail}>
              <Mail className="mr-2 h-4 w-4" />
              Send to Email
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}