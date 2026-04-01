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
import { Loader2, Pause, Play } from "lucide-react"
import { toast } from "sonner"

interface PauseMembershipButtonProps {
  memberId: string
  isPaused: boolean
  onToggle?: () => void
}

export function PauseMembershipButton({ memberId, isPaused, onToggle }: PauseMembershipButtonProps) {
  const params = useParams()
  const orgSlug = params.orgSlug as string
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handlePause = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/organizations/${orgSlug}/members/${memberId}/pause`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paused: !isPaused }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || `Failed to ${isPaused ? "resume" : "pause"} membership`)
      }

      toast.success(isPaused ? "Membership resumed" : "Membership paused")
      setOpen(false)
      onToggle?.()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          {isPaused ? (
            <>
              <Play className="mr-2 h-4 w-4" />
              Resume Membership
            </>
          ) : (
            <>
              <Pause className="mr-2 h-4 w-4" />
              Pause Membership
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isPaused ? "Resume Membership" : "Pause Membership"}</DialogTitle>
          <DialogDescription>
            {isPaused 
              ? "Resuming will reactivate the membership and resume billing on the next cycle."
              : "Pausing will temporarily suspend the membership. No payments will be collected while paused."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handlePause} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isPaused ? "Resuming..." : "Pausing..."}
              </>
            ) : (
              isPaused ? "Resume" : "Pause"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}