"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { EventForm } from "@/components/events/EventForm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs"
import { RSVPList } from "@/components/events/RSVPList"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ManageEventPage() {
  const router = useRouter()
  const params = useParams()
  const orgSlug = params.orgSlug as string
  const eventId = params.eventId as string
  const [event, setEvent] = useState<any>(null)
  const [houses, setHouses] = useState<Array<{ id: string; name: string }>>([])
  const [attendees, setAttendees] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`/api/organizations/${orgSlug}/events/${eventId}`).then(res => res.json()),
      fetch(`/api/organizations/${orgSlug}/houses`).then(res => res.json()),
      fetch(`/api/organizations/${orgSlug}/events/${eventId}/attendees`).then(res => res.json()),
    ]).then(([eventData, housesData, attendeesData]) => {
      setEvent(eventData)
      setHouses(housesData.houses || [])
      setAttendees(attendeesData.attendees || [])
      setLoading(false)
    }).catch((error) => {
      console.error("Failed to load data", error)
      toast.error("Failed to load event data")
      router.push(`/organization/${orgSlug}/events`)
    })
  }, [orgSlug, eventId, router])

  const handleUpdate = async (data: any) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/organizations/${orgSlug}/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to update event")
      }

      toast.success("Event updated successfully")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckIn = async (attendeeId: string) => {
    try {
      const res = await fetch(`/api/organizations/${orgSlug}/events/${eventId}/attendees`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rsvpId: attendeeId, checkedIn: true }),
      })

      if (!res.ok) {
        throw new Error("Failed to check in")
      }

      toast.success("Attendee checked in successfully")
      // Refresh attendees list
      const attendeesRes = await fetch(`/api/organizations/${orgSlug}/events/${eventId}/attendees`)
      const attendeesData = await attendeesRes.json()
      setAttendees(attendeesData.attendees || [])
    } catch (error) {
      toast.error("Failed to check in")
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!event) {
    return <div>Event not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/organization/${orgSlug}/events/${eventId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manage Event</h1>
          <p className="text-muted-foreground">{event.title}</p>
        </div>
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Event Details</TabsTrigger>
          <TabsTrigger value="attendees">Attendees ({attendees.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Edit Event</CardTitle>
              <CardDescription>
                Update event information and settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EventForm
                houses={houses}
                initialData={event}
                onSubmit={handleUpdate}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendees">
          <RSVPList
            attendees={attendees}
            eventId={eventId}
            onCheckIn={handleCheckIn}
            canManage={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}