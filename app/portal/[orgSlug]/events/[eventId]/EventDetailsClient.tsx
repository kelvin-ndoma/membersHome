// app/portal/[orgSlug]/events/[eventId]/EventDetailsClient.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Textarea } from "@/components/ui/Textarea"
import { CheckCircle, XCircle, Clock, Loader2, Users, Plus, Minus, CalendarCheck, UserPlus } from "lucide-react"
import { toast } from "sonner"

interface EventDetailsClientProps {
  event: {
    id: string
    title: string
    startDate: Date
    isFree: boolean
    price: number | null
    currency: string
    capacity: number | null
    myRSVP: {
      id: string
      status: string
      guestsCount: number
      notes: string | null
    } | null
    rsvpCount: number
  }
  membershipId: string
  orgSlug: string
}

export function EventDetailsClient({ event, membershipId, orgSlug }: EventDetailsClientProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [guestsCount, setGuestsCount] = useState(event.myRSVP?.guestsCount || 0)
  const [notes, setNotes] = useState(event.myRSVP?.notes || "")
  const [showForm, setShowForm] = useState(!event.myRSVP)

  const isPastEvent = new Date(event.startDate) < new Date()
  const isAtCapacity = event.capacity && event.rsvpCount >= event.capacity

  const handleRSVP = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/organizations/${orgSlug}/events/${event.id}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membershipId,
          guestsCount,
          notes,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to RSVP")
      }

      toast.success("Successfully RSVP'd to event!")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelRSVP = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/organizations/${orgSlug}/events/${event.id}/rsvp`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId }),
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

  const handleUpdateRSVP = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/organizations/${orgSlug}/events/${event.id}/rsvp`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membershipId,
          guestsCount,
          notes,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to update RSVP")
      }

      toast.success("RSVP updated!")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (isPastEvent) {
    return (
      <Card className="shadow-lg border-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">RSVP</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-3 font-medium">Event has passed</p>
            <p className="text-sm text-muted-foreground mt-1">
              You can no longer RSVP to this event
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (event.myRSVP) {
    return (
      <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center justify-between">
            <span>Your RSVP</span>
            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
              Confirmed
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-white/5 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="font-medium">You're attending!</span>
            </div>
            {event.myRSVP.guestsCount > 0 && (
              <Badge variant="outline">
                +{event.myRSVP.guestsCount} guest{event.myRSVP.guestsCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {!showForm ? (
            <div className="space-y-3">
              {event.myRSVP.notes && (
                <div className="p-3 bg-white/50 dark:bg-white/5 rounded-lg">
                  <p className="text-xs text-muted-foreground">Your notes:</p>
                  <p className="text-sm mt-1">{event.myRSVP.notes}</p>
                </div>
              )}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowForm(true)}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleCancelRSVP}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Cancel"
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Number of Guests</Label>
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setGuestsCount(Math.max(0, guestsCount - 1))}
                    disabled={guestsCount === 0}
                    className="h-10 w-10"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-2xl font-semibold w-12 text-center">{guestsCount}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setGuestsCount(guestsCount + 1)}
                    className="h-10 w-10"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any dietary restrictions or special requests?"
                  rows={2}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleUpdateRSVP}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Update"
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">RSVP to Event</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {isAtCapacity ? (
          <div className="text-center py-6">
            <XCircle className="mx-auto h-12 w-12 text-red-500" />
            <p className="mt-2 font-medium">Event is at capacity</p>
            <p className="text-sm text-muted-foreground mt-1">
              Sorry, this event is fully booked
            </p>
          </div>
        ) : (
          <>
            {!event.isFree && (
              <div className="text-center p-3 bg-white/50 dark:bg-white/5 rounded-lg">
                <p className="text-sm">
                  Price: <span className="font-semibold text-lg">{event.currency} {event.price}</span>
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-center block">Number of Guests</Label>
              <div className="flex items-center justify-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setGuestsCount(Math.max(0, guestsCount - 1))}
                  disabled={guestsCount === 0}
                  className="h-12 w-12"
                >
                  <Minus className="h-5 w-5" />
                </Button>
                <div className="text-center">
                  <span className="text-3xl font-bold w-16 inline-block">{guestsCount}</span>
                  <p className="text-xs text-muted-foreground mt-1">guests</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setGuestsCount(guestsCount + 1)}
                  className="h-12 w-12"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any dietary restrictions or special requests?"
                rows={2}
                className="resize-none"
              />
            </div>

            <Button
              className="w-full h-12 text-base font-semibold"
              onClick={handleRSVP}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <UserPlus className="mr-2 h-5 w-5" />
              )}
              {guestsCount === 0 ? "RSVP for Myself" : `RSVP for Myself + ${guestsCount}`}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}