"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import EventForm from "@/components/org/EventForm"

export default function EditEventPage() {
  const params = useParams()
  const orgSlug = params.orgSlug as string
  const houseSlug = params.houseSlug as string
  const eventId = params.eventId as string
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEvent()
  }, [])

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/org/${orgSlug}/houses/${houseSlug}/events/${eventId}`)
      const data = await response.json()
      setEvent(data)
    } catch (error) {
      console.error("Failed to fetch event:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Edit Event</h1>
        <p className="text-gray-500">Update event details, image, and settings</p>
      </div>
      <EventForm orgSlug={orgSlug} houseSlug={houseSlug} initialData={event} isEditing />
    </div>
  )
}