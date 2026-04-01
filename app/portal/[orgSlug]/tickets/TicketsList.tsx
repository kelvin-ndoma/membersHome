// app/portal/[orgSlug]/tickets/TicketsList.tsx
"use client"

import { useState } from "react"
import { format } from "date-fns"
import { QRCodeSVG } from "qrcode.react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { ChevronDown, ChevronUp, Ticket, Download, CheckCircle, XCircle } from "lucide-react"

interface TicketPurchase {
  id: string
  quantity: number
  totalAmount: number
  currency: string
  paymentStatus: string
  createdAt: Date
  ticketCodes: string[]
  usedCount: number
  fullyUsed: boolean
  ticket: {
    name: string
    description: string | null
    event: {
      id: string
      title: string
      startDate: Date
      location: string | null
    } | null
  }
  validations: Array<{
    id: string
    ticketCode: string
    validatedAt: Date
    isValid: boolean
  }>
}

interface TicketsListProps {
  tickets: TicketPurchase[]
  orgSlug: string
}

export function TicketsList({ tickets, orgSlug }: TicketsListProps) {
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null)

  const getStatusBadge = (paymentStatus: string, fullyUsed: boolean) => {
    if (fullyUsed) {
      return <Badge className="bg-gray-100 text-gray-800">Fully Used</Badge>
    }
    switch (paymentStatus) {
      case "SUCCEEDED":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Payment</Badge>
      case "FAILED":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      default:
        return <Badge>{paymentStatus}</Badge>
    }
  }

  const downloadQRCode = (code: string, index: number) => {
    // Create canvas from QR code
    const canvas = document.createElement('canvas')
    const svg = document.querySelector(`#qr-${code}`) as SVGElement
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg)
      const img = new Image()
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0)
        const pngFile = canvas.toDataURL('image/png')
        const downloadLink = document.createElement('a')
        downloadLink.download = `ticket-${code}.png`
        downloadLink.href = pngFile
        downloadLink.click()
      }
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
    }
  }

  return (
    <div className="space-y-4">
      {tickets.map((purchase) => (
        <Card key={purchase.id} className="overflow-hidden">
          <CardHeader 
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setExpandedTicket(expandedTicket === purchase.id ? null : purchase.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Ticket className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-lg">{purchase.ticket.name}</CardTitle>
                  {purchase.ticket.event && (
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(purchase.ticket.event.startDate), "MMM d, yyyy • h:mm a")}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge(purchase.paymentStatus, purchase.fullyUsed)}
                <span className="text-sm font-medium">
                  {purchase.usedCount}/{purchase.quantity} used
                </span>
                {expandedTicket === purchase.id ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </div>
            </div>
          </CardHeader>
          
          {expandedTicket === purchase.id && (
            <CardContent className="border-t pt-4 space-y-4">
              <div className="grid gap-2 text-sm">
                {purchase.ticket.event && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Event:</span>
                      <span className="font-medium">{purchase.ticket.event.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location:</span>
                      <span>{purchase.ticket.event.location || "TBD"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span>{format(new Date(purchase.ticket.event.startDate), "MMM d, yyyy • h:mm a")}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quantity:</span>
                  <span>{purchase.quantity} tickets</span>
                </div>
                {purchase.ticket.description && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Description:</span>
                    <span className="text-right max-w-[60%]">{purchase.ticket.description}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-medium">
                    {purchase.currency} {purchase.totalAmount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Purchased:</span>
                  <span>{format(new Date(purchase.createdAt), "MMM d, yyyy")}</span>
                </div>
              </div>

              {purchase.ticketCodes.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-3">Ticket QR Codes</p>
                  <div className="grid gap-4">
                    {purchase.ticketCodes.map((code, index) => {
                      const isValidated = purchase.validations.some(v => v.ticketCode === code)
                      const validation = purchase.validations.find(v => v.ticketCode === code)
                      
                      return (
                        <div key={code} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                          <div className="flex-1">
                            <p className="font-mono text-sm">{code}</p>
                            <p className="text-xs text-muted-foreground mt-1">Ticket #{index + 1}</p>
                            {isValidated && validation && (
                              <p className="text-xs text-green-600 mt-1">
                                Validated: {format(new Date(validation.validatedAt), "MMM d, h:mm a")}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            {isValidated ? (
                              <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Validated
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <XCircle className="h-3 w-3" />
                                Not Used
                              </Badge>
                            )}
                            <div className="bg-white p-2 rounded-lg">
                              <QRCodeSVG
                                id={`qr-${code}`}
                                value={code}
                                size={64}
                                level="H"
                                includeMargin
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => downloadQRCode(code, index)}
                              className="shrink-0"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  )
}