"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/Dialog"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { toast } from "sonner"

interface TicketPurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  ticket: {
    id: string
    name: string
    price: number
    currency: string
    maxPerPurchase: number
    availableQuantity: number
    memberPrice?: number | null
  }
  isMember?: boolean
  onConfirm: (data: { quantity: number; customerName: string; customerEmail: string; customerPhone?: string }) => Promise<void>
}

export function TicketPurchaseModal({ isOpen, onClose, ticket, isMember = false, onConfirm }: TicketPurchaseModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [customerName, setCustomerName] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const unitPrice = isMember && ticket.memberPrice ? ticket.memberPrice : ticket.price
  const totalAmount = unitPrice * quantity

  const handleConfirm = async () => {
    if (!customerName || !customerEmail) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsLoading(true)
    try {
      await onConfirm({ quantity, customerName, customerEmail, customerPhone })
      onClose()
      toast.success("Ticket purchase initiated!")
    } catch (error) {
      toast.error("Failed to purchase ticket")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Purchase {ticket.name}</DialogTitle>
          <DialogDescription>
            {isMember && ticket.memberPrice && (
              <span className="text-green-600">Member price applied!</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              max={Math.min(ticket.maxPerPurchase, ticket.availableQuantity)}
              value={quantity}
              onChange={(e) => setQuantity(Math.min(Math.max(1, parseInt(e.target.value) || 1), ticket.maxPerPurchase, ticket.availableQuantity))}
            />
            <p className="text-xs text-muted-foreground">
              Max {Math.min(ticket.maxPerPurchase, ticket.availableQuantity)} per purchase
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="john@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone (Optional)</Label>
            <Input
              id="phone"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="+1 234 567 8900"
            />
          </div>

          <div className="rounded-lg bg-muted p-4">
            <div className="flex justify-between">
              <span>Unit Price:</span>
              <span>{ticket.currency} {unitPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total:</span>
              <span>{ticket.currency} {totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={isLoading} className="flex-1">
              {isLoading ? "Processing..." : "Continue to Payment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}