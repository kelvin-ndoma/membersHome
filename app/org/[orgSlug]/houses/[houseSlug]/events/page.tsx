"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { format } from "date-fns"
import { Toast, useToast } from "@/components/ui/toast"

interface Event {
  id: string
  title: string
  slug: string
  description: string | null
  imageUrl: string
  startDate: string
  endDate: string
  location: string | null
  onlineUrl: string | null
  type: string
  status: string
  isFree: boolean
  price: number
  memberOnly: boolean
  capacity: number | null
  _count: {
    rsvps: number
    tickets: number
  }
}

export default function HouseEventsPage() {
  const params = useParams()
  const orgSlug = params.orgSlug as string
  const houseSlug = params.houseSlug as string
  const { toast, showToast, hideToast } = useToast()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    fetchEvents()
  }, [orgSlug, houseSlug, filter])

  const fetchEvents = async () => {
    try {
      const response = await fetch(`/api/org/${orgSlug}/houses/${houseSlug}/events?status=${filter}`)
      const data = await response.json()
      setEvents(data)
    } catch (error) {
      console.error("Failed to fetch events:", error)
      showToast("Failed to fetch events", "error")
    } finally {
      setLoading(false)
    }
  }

  const updateEventStatus = async (eventId: string, status: string) => {
    try {
      const response = await fetch(`/api/org/${orgSlug}/houses/${houseSlug}/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        showToast(`Event ${status.toLowerCase()} successfully!`, "success")
        fetchEvents()
      } else {
        showToast("Failed to update event status", "error")
      }
    } catch (error) {
      showToast("Failed to update event status", "error")
    }
  }

  const deleteEvent = async (eventId: string, eventTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${eventTitle}"? This will also delete all RSVPs and tickets.`)) return

    try {
      const response = await fetch(`/api/org/${orgSlug}/houses/${houseSlug}/events/${eventId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        showToast(`Event "${eventTitle}" deleted successfully!`, "success")
        fetchEvents()
      } else {
        showToast("Failed to delete event", "error")
      }
    } catch (error) {
      showToast("Failed to delete event", "error")
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "bg-green-100 text-green-800"
      case "DRAFT":
        return "bg-gray-100 text-gray-800"
      case "COMPLETED":
        return "bg-blue-100 text-blue-800"
      case "CANCELLED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "IN_PERSON":
        return "📍"
      case "ONLINE":
        return "💻"
      case "HYBRID":
        return "🌐"
      default:
        return "📅"
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
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-500 mt-1">Manage your house events, tickets, and attendee RSVPs</p>
        </div>
        <Link
          href={`/org/${orgSlug}/houses/${houseSlug}/events/create`}
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Event
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-2">
          {[
            { value: "all", label: "All Events" },
            { value: "DRAFT", label: "Draft" },
            { value: "PUBLISHED", label: "Published" },
            { value: "COMPLETED", label: "Completed" },
            { value: "CANCELLED", label: "Cancelled" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === option.value
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      {events.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
          <p className="text-gray-500 mb-4">Create your first event to start managing tickets and RSVPs</p>
          <Link
            href={`/org/${orgSlug}/houses/${houseSlug}/events/create`}
            className="inline-flex items-center text-blue-600 hover:text-blue-700"
          >
            Create Event →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div
              key={event.id}
              className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-200"
            >
              {/* Event Image */}
              <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                {event.imageUrl ? (
                  <Image
                    src={event.imageUrl}
                    alt={event.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-5xl">{getTypeIcon(event.type)}</span>
                  </div>
                )}
                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(event.status)}`}>
                    {event.status}
                  </span>
                </div>
                {/* Member Only Badge */}
                {event.memberOnly && (
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Members Only
                    </span>
                  </div>
                )}
                {/* Event Type Badge */}
                <div className="absolute bottom-3 left-3">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-black/50 text-white backdrop-blur-sm">
                    {event.type.replace("_", " ")}
                  </span>
                </div>
              </div>

              {/* Event Details */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">{event.title}</h3>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span>📅</span>
                    <span>{format(new Date(event.startDate), "MMM d, yyyy")}</span>
                    <span>•</span>
                    <span>{format(new Date(event.startDate), "h:mm a")}</span>
                  </div>
                  
                  {event.location && (
                    <div className="flex items-center gap-2">
                      <span>📍</span>
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                  )}
                  
                  {event.onlineUrl && (
                    <div className="flex items-center gap-2">
                      <span>💻</span>
                      <span className="line-clamp-1">Online Event</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">🎫</span>
                      <span>{event.isFree ? "Free" : `$${event.price}`}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">👥</span>
                      <span>{event._count.rsvps} RSVPs</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">🎟️</span>
                      <span>{event._count.tickets} sold</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-2 justify-between items-center">
                  <div className="flex gap-2">
                    {event.status === "DRAFT" && (
                      <button
                        onClick={() => updateEventStatus(event.id, "PUBLISHED")}
                        className="text-xs text-green-600 hover:text-green-800 font-medium"
                      >
                        Publish
                      </button>
                    )}
                    {event.status === "PUBLISHED" && (
                      <button
                        onClick={() => updateEventStatus(event.id, "CANCELLED")}
                        className="text-xs text-red-600 hover:text-red-800 font-medium"
                      >
                        Cancel
                      </button>
                    )}
                    <Link
                      href={`/org/${orgSlug}/houses/${houseSlug}/events/${event.id}/tickets`}
                      className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                    >
                      Tickets
                    </Link>
                  </div>
                  <div className="flex gap-3">
                    <Link
                      href={`/org/${orgSlug}/houses/${houseSlug}/events/${event.id}/edit`}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => deleteEvent(event.id, event.title)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Summary */}
      {events.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">{events.length}</p>
              <p className="text-xs text-gray-500">Total Events</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {events.reduce((sum, e) => sum + e._count.rsvps, 0)}
              </p>
              <p className="text-xs text-gray-500">Total RSVPs</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {events.reduce((sum, e) => sum + e._count.tickets, 0)}
              </p>
              <p className="text-xs text-gray-500">Tickets Sold</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {events.filter(e => e.status === "PUBLISHED").length}
              </p>
              <p className="text-xs text-gray-500">Active Events</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}