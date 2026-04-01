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
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Textarea } from "@/components/ui/Textarea"
import { Loader2, Users } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface PublicRSVPButtonProps {
  eventId: string
  orgSlug: string
  action: "rsvp" | "cancel"
  isLoggedIn: boolean
  isMember: boolean
}

export function PublicRSVPButton({ 
  eventId, 
  orgSlug, 
  action, 
  isLoggedIn, 
  isMember 
}: PublicRSVPButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [guestsCount, setGuestsCount] = useState(0)
  const [notes, setNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleRSVP = async () => {
    if (!isLoggedIn) {
      router.push(`/auth/login?callbackUrl=/events/${orgSlug}/${eventId}`)
      return
    }

    if (!isMember) {
      router.push(`/membership/apply/${orgSlug}`)
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(`/api/organizations/${orgSlug}/events/${eventId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestsCount, notes }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to RSVP")
      }

      toast.success("Successfully RSVP'd to the event!")
      setOpen(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/organizations/${orgSlug}/events/${eventId}/rsvp`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to cancel RSVP")
      }

      toast.success("RSVP cancelled")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (action === "cancel") {
    return (
      <Button 
        variant="outline" 
        className="w-full text-red-600 hover:text-red-700"
        onClick={handleCancel}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Cancelling...
          </>
        ) : (
          "Cancel RSVP"
        )}
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          RSVP to Event
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>RSVP to Event</DialogTitle>
          <DialogDescription>
            Let us know if you're planning to attend.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="guests">Number of Guests</Label>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <Input
                id="guests"
                type="number"
                min={0}
                max={5}
                value={guestsCount}
                onChange={(e) => setGuestsCount(parseInt(e.target.value) || 0)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              You can bring up to 5 guests.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any special requests or dietary restrictions?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleRSVP} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Confirm RSVP"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}