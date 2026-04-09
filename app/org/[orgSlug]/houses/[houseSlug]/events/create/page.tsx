"use client"

import { useParams } from "next/navigation"
import EventForm from "@/components/org/EventForm"

export default function CreateEventPage() {
  const params = useParams()
  const orgSlug = params.orgSlug as string
  const houseSlug = params.houseSlug as string

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Create New Event</h1>
        <p className="text-gray-500">Create an event with image, tickets, and manage RSVPs</p>
      </div>
      <EventForm orgSlug={orgSlug} houseSlug={houseSlug} />
    </div>
  )
}