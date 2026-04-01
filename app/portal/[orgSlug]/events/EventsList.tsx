// app/portal/[orgSlug]/events/EventsList.tsx (update the event card)
"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { format } from "date-fns"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Calendar, MapPin, Users, Clock, Home } from "lucide-react"
import { toast } from "sonner"

interface Event {
  id: string
  title: string
  imageUrl: string | null
  startDate: Date
  location: string | null
  house: { name: string } | null
  _count: { rsvps: number }
}

interface EventsListProps {
  events: Event[]
  membershipId: string
  orgSlug: string
  houses: { id: string; name: string; slug: string }[]
  rsvpMap: Map<string, number>
}

export function EventsList({ events, membershipId, orgSlug, houses, rsvpMap }: EventsListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState<string | null>(null)

  const handleRSVP = async (eventId: string) => {
    setLoading(eventId)
    try {
      const res = await fetch(`/api/organizations/${orgSlug}/events/${eventId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId }),
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
      setLoading(null)
    }
  }

  const handleCancelRSVP = async (eventId: string) => {
    setLoading(eventId)
    try {
      const res = await fetch(`/api/organizations/${orgSlug}/events/${eventId}/rsvp`, {
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
      setLoading(null)
    }
  }

  if (events.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No events found</h3>
          <p className="mt-2 text-muted-foreground">
            Check back later for upcoming events
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => {
        const isRSVPd = rsvpMap.has(event.id)
        const guestsCount = rsvpMap.get(event.id) || 0

        return (
          <Card key={event.id} className="hover:shadow-lg transition-shadow overflow-hidden">
            {event.imageUrl && (
              <div className="relative w-full h-48">
                <Image
                  src={event.imageUrl}
                  alt={event.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
            )}
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-xl line-clamp-2">{event.title}</CardTitle>
                {event.house && (
                  <Badge variant="outline" className="flex items-center gap-1 shrink-0 ml-2">
                    <Home className="h-3 w-3" />
                    {event.house.name}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(event.startDate), "EEE, MMM d • h:mm a")}</span>
              </div>
              {event.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="line-clamp-1">{event.location}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{event._count.rsvps} attending</span>
              </div>
              {isRSVPd && (
                <Badge variant="secondary" className="mt-2">
                  You're attending {guestsCount > 0 ? `+${guestsCount} guest${guestsCount > 1 ? 's' : ''}` : ""}
                </Badge>
              )}
            </CardContent>
            <CardFooter className="flex gap-2">
              <Link href={`/portal/${orgSlug}/events/${event.id}`} className="flex-1">
                <Button variant="outline" className="w-full">
                  View Details
                </Button>
              </Link>
              {isRSVPd ? (
                <Button 
                  variant="destructive" 
                  className="flex-1"
                  onClick={() => handleCancelRSVP(event.id)}
                  disabled={loading === event.id}
                >
                  {loading === event.id ? "Canceling..." : "Cancel"}
                </Button>
              ) : (
                <Button 
                  className="flex-1"
                  onClick={() => handleRSVP(event.id)}
                  disabled={loading === event.id}
                >
                  {loading === event.id ? "Processing..." : "RSVP"}
                </Button>
              )}
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}