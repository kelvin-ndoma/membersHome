// app/organization/[orgSlug]/houses/[houseSlug]/members/[memberId]/AddPlanDialog.tsx
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
import { Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"

export interface AddPlanDialogProps {
  memberId: string  // This should be the HouseMembership ID
  availablePlans: Array<{ id: string; name: string; amount: number; billingFrequency: string; description?: string | null }>
  orgSlug: string
  houseSlug: string
}

export function AddPlanDialog({ memberId, availablePlans, orgSlug, houseSlug }: AddPlanDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState("")

  const handleAddPlan = async () => {
    if (!selectedPlanId) {
      toast.error("Please select a plan")
      return
    }

    setIsLoading(true)
    
    const url = `/api/organizations/${orgSlug}/houses/${houseSlug}/members/${memberId}/add-plan`
    console.log("=== AddPlanDialog Debug ===")
    console.log("URL:", url)
    console.log("memberId (HouseMembership ID):", memberId)
    console.log("selectedPlanId:", selectedPlanId)
    
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedPlanId }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to add plan")
      }

      toast.success("Plan added successfully")
      setIsOpen(false)
      setSelectedPlanId("")
      window.location.reload()
    } catch (error: any) {
      console.error("Error adding plan:", error)
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
          <Plus className="mr-2 h-3 w-3" />
          Add Plan
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Plan</DialogTitle>
          <DialogDescription>
            Add an additional membership plan
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Select Plan</Label>
            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a plan..." />
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
                {selectedPlan.description && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Description</span>
                    <span className="text-right max-w-[60%]">{selectedPlan.description}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddPlan} disabled={isLoading || availablePlans.length === 0}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Plan"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}