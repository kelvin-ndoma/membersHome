// app/organization/[orgSlug]/houses/[houseSlug]/members/[memberId]/AddPaymentDialog.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog"
import { Label } from "@/components/ui/Label"
import { Input } from "@/components/ui/Input"
import { Textarea } from "@/components/ui/Textarea"
import { Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"

export interface AddPaymentDialogProps {
  memberId: string
  orgSlug: string
  houseSlug: string
}

export function AddPaymentDialog({ memberId, orgSlug, houseSlug }: AddPaymentDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")

  const handleAddPayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(`/api/organizations/${orgSlug}/houses/${houseSlug}/members/${memberId}/add-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          amount: parseFloat(amount),
          description 
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to add payment")
      }

      toast.success("Payment added successfully")
      setIsOpen(false)
      setAmount("")
      setDescription("")
      window.location.reload()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add Payment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Payment</DialogTitle>
          <DialogDescription>
            Record a manual payment
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Amount *</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Description (Optional)</Label>
            <Textarea
              placeholder="Payment description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddPayment} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Payment"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}