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
import { Loader2, Calendar, Users } from "lucide-react"
import { toast } from "sonner"

interface RSVPButtonProps {
  eventId: string
  orgSlug: string
  maxGuests?: number
  isMemberOnly?: boolean
  isFull?: boolean
  isPast?: boolean
  isPublished?: boolean
}

export function RSVPButton({ 
  eventId, 
  orgSlug, 
  maxGuests = 5, 
  isMemberOnly = false,
  isFull = false,
  isPast = false,
  isPublished = true
}: RSVPButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [guestsCount, setGuestsCount] = useState(0)
  const [notes, setNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const canRSVP = isPublished && !isPast && !isFull

  const handleRSVP = async () => {
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

  if (!canRSVP) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Calendar className="mr-2 h-4 w-4" />
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
                max={maxGuests}
                value={guestsCount}
                onChange={(e) => setGuestsCount(parseInt(e.target.value) || 0)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              You can bring up to {maxGuests} guests.
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