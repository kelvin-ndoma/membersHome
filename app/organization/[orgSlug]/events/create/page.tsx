"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { EventForm } from "@/components/events/EventForm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { toast } from "sonner"

export default function CreateEventPage() {
  const router = useRouter()
  const params = useParams()
  const orgSlug = params.orgSlug as string
  const [houses, setHouses] = useState<Array<{ id: string; name: string }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadingHouses, setLoadingHouses] = useState(true)

  useEffect(() => {
    fetch(`/api/organizations/${orgSlug}/houses`)
      .then((res) => res.json())
      .then((data) => {
        setHouses(data.houses || [])
        setLoadingHouses(false)
      })
      .catch((error) => {
        console.error("Failed to load houses", error)
        setLoadingHouses(false)
      })
  }, [orgSlug])

  const handleSubmit = async (data: any) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/organizations/${orgSlug}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to create event")
      }

      const event = await res.json()
      toast.success("Event created successfully!")
      router.push(`/organization/${orgSlug}/events/${event.id}`)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (loadingHouses) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Create Event</CardTitle>
          <CardDescription>
            Create a new event for your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EventForm
            houses={houses}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  )
}