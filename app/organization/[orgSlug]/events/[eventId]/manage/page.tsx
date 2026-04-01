"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { EventForm } from "@/components/events/EventForm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs"
import { RSVPList } from "@/components/events/RSVPList"
import { Badge } from "@/components/ui/Badge"
import { Switch } from "@/components/ui/Switch"
import { Label } from "@/components/ui/Label"
import { toast } from "sonner"
import { ArrowLeft, Eye, EyeOff, Trash2, Loader2 } from "lucide-react"
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
  const [isPublishing, setIsPublishing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
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

      // Refresh event data
      const updatedEvent = await res.json()
      setEvent(updatedEvent)
      toast.success("Event updated successfully")
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePublishToggle = async () => {
    setIsPublishing(true)
    try {
      const newStatus = event.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED"
      const res = await fetch(`/api/organizations/${orgSlug}/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to update event status")
      }

      setEvent({ ...event, status: newStatus })
      toast.success(newStatus === "PUBLISHED" ? "Event published!" : "Event saved as draft")
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsPublishing(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      return
    }

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/organizations/${orgSlug}/events/${eventId}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to delete event")
      }

      toast.success("Event deleted successfully")
      router.push(`/organization/${orgSlug}/events`)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsDeleting(false)
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

  const getStatusBadge = () => {
    if (!event) return null
    switch (event.status) {
      case "PUBLISHED":
        return <Badge className="bg-green-100 text-green-800">Published</Badge>
      case "DRAFT":
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>
      case "CANCELLED":
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>
      case "COMPLETED":
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>
      default:
        return <Badge>{event.status}</Badge>
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

  const isPublished = event.status === "PUBLISHED"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/organization/${orgSlug}/events/${eventId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Manage Event</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-muted-foreground">{event.title}</p>
              {getStatusBadge()}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={isPublished ? "outline" : "default"}
            onClick={handlePublishToggle}
            disabled={isPublishing}
          >
            {isPublishing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : isPublished ? (
              <EyeOff className="mr-2 h-4 w-4" />
            ) : (
              <Eye className="mr-2 h-4 w-4" />
            )}
            {isPublished ? "Unpublish" : "Publish"}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Delete
          </Button>
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