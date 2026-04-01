"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
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
import { Textarea } from "@/components/ui/Textarea"
import { Loader2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

interface CancelMembershipButtonProps {
  memberId: string
  memberName: string
  onCancel?: () => void
}

export function CancelMembershipButton({ memberId, memberName, onCancel }: CancelMembershipButtonProps) {
  const params = useParams()
  const orgSlug = params.orgSlug as string
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [reason, setReason] = useState("")
  const [cancelImmediately, setCancelImmediately] = useState(true)

  const handleCancel = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/organizations/${orgSlug}/members/${memberId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason,
          cancelImmediately,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to cancel membership")
      }

      toast.success(`Membership for ${memberName} has been cancelled`)
      setOpen(false)
      onCancel?.()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">
          Cancel Membership
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Cancel Membership
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel {memberName}'s membership? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="cancelImmediate">Cancellation Type</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={cancelImmediately}
                  onChange={() => setCancelImmediately(true)}
                  className="h-4 w-4"
                />
                <span>Cancel Immediately</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={!cancelImmediately}
                  onChange={() => setCancelImmediately(false)}
                  className="h-4 w-4"
                />
                <span>Cancel at End of Billing Period</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Cancellation (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="e.g., Found a better option, Too expensive, Not using benefits..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          {cancelImmediately && (
            <div className="rounded-lg bg-red-50 p-3 text-red-800">
              <p className="text-sm font-medium">Immediate Cancellation</p>
              <p className="text-xs mt-1">
                The member will lose all benefits immediately and will not be billed again.
                Any unused time will not be refunded.
              </p>
            </div>
          )}

          {!cancelImmediately && (
            <div className="rounded-lg bg-blue-50 p-3 text-blue-800">
              <p className="text-sm font-medium">End of Period Cancellation</p>
              <p className="text-xs mt-1">
                The member will retain benefits until the end of the current billing period.
                No further payments will be charged after that.
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Keep Membership
          </Button>
          <Button variant="destructive" onClick={handleCancel} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cancelling...
              </>
            ) : (
              "Confirm Cancellation"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}