// app/organization/[orgSlug]/houses/[houseSlug]/members/[memberId]/ChangePlanDialog.tsx
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select"
import { RefreshCw, Loader2 } from "lucide-react"
import { toast } from "sonner"

export interface ChangePlanDialogProps {
  membershipItemId: string
  currentPlanId: string
  availablePlans: Array<{ id: string; name: string; amount: number; billingFrequency: string }>
  orgSlug: string
  houseSlug: string
  memberId: string
}

export function ChangePlanDialog({ 
  membershipItemId, 
  currentPlanId, 
  availablePlans, 
  orgSlug, 
  houseSlug, 
  memberId 
}: ChangePlanDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState(currentPlanId)

  const handleChangePlan = async () => {
    if (selectedPlanId === currentPlanId) {
      toast.info("This is already the member's current plan")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(`/api/organizations/${orgSlug}/houses/${houseSlug}/members/${memberId}/change-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          membershipItemId,
          newPlanId: selectedPlanId 
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to change plan")
      }

      toast.success("Membership plan updated successfully")
      setIsOpen(false)
      window.location.reload()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const selectedPlan = availablePlans.find(p => p.id === selectedPlanId)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <RefreshCw className="mr-2 h-3 w-3" />
          Change Plan
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Plan</DialogTitle>
          <DialogDescription>
            Select a new membership plan
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Select Plan</Label>
            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availablePlans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name} - ${plan.amount}/{plan.billingFrequency.toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPlan && (
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm font-medium mb-2">Plan Summary</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price</span>
                  <span>${selectedPlan.amount}/{selectedPlan.billingFrequency.toLowerCase()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleChangePlan} disabled={isLoading || availablePlans.length === 0}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Plan"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}