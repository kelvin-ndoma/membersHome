"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"

interface HouseStats {
  id: string
  name: string
  slug: string
  description: string | null
  _count: {
    members: number
    events: number
  }
  recentMembers: Array<{
    id: string
    user: {
      name: string
      email: string
    }
    createdAt: string
  }>
  upcomingEvents: Array<{
    id: string
    title: string
    startDate: string
    location: string
  }>
  pendingApplications: number
}

export default function HouseDashboardPage() {
  const params = useParams()
  const orgSlug = params.orgSlug as string
  const houseSlug = params.houseSlug as string
  const [stats, setStats] = useState<HouseStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHouseStats()
  }, [orgSlug, houseSlug])

  const fetchHouseStats = async () => {
    try {
      const response = await fetch(`/api/org/${orgSlug}/houses/${houseSlug}/stats`)
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error("Failed to fetch house stats:", error)
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
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{stats?.name} Dashboard</h1>
      {stats?.description && (
        <p className="text-gray-500 mb-8">{stats.description}</p>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <span className="text-2xl">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total Members</p>
              <p className="text-2xl font-bold text-gray-900">{stats?._count.members ?? 0}</p>
            </div>
          </div>
          <Link href={`/org/${orgSlug}/houses/${houseSlug}/members`} className="text-sm text-blue-600 hover:text-blue-800 mt-3 inline-block">
            View all members →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <span className="text-2xl">📅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total Events</p>
              <p className="text-2xl font-bold text-gray-900">{stats?._count.events ?? 0}</p>
            </div>
          </div>
          <Link href={`/org/${orgSlug}/houses/${houseSlug}/events`} className="text-sm text-blue-600 hover:text-blue-800 mt-3 inline-block">
            Manage events →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <span className="text-2xl">🎫</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Membership Plans</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
          <Link href={`/org/${orgSlug}/houses/${houseSlug}/plans`} className="text-sm text-blue-600 hover:text-blue-800 mt-3 inline-block">
            Manage plans →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <span className="text-2xl">📋</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Pending Apps</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.pendingApplications ?? 0}</p>
            </div>
          </div>
          <Link href={`/org/${orgSlug}/houses/${houseSlug}/applications`} className="text-sm text-blue-600 hover:text-blue-800 mt-3 inline-block">
            Review →
          </Link>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
          <Link href={`/org/${orgSlug}/houses/${houseSlug}/events/create`} className="text-sm text-blue-600 hover:text-blue-800">
            + Create Event
          </Link>
        </div>
        <div className="p-6">
          {!stats?.upcomingEvents || stats.upcomingEvents.length === 0 ? (
            <p className="text-gray-500 text-center">No upcoming events. Create your first event!</p>
          ) : (
            <div className="space-y-4">
              {stats.upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h3 className="font-medium text-gray-900">{event.title}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(event.startDate).toLocaleDateString()} • {event.location || "Online"}
                    </p>
                  </div>
                  <Link href={`/org/${orgSlug}/houses/${houseSlug}/events/${event.id}`} className="text-blue-600 hover:text-blue-800 text-sm">
                    View →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Members */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Recent Members</h2>
        </div>
        <div className="p-6">
          {!stats?.recentMembers || stats.recentMembers.length === 0 ? (
            <p className="text-gray-500 text-center">No members yet. Invite your first member!</p>
          ) : (
            <div className="space-y-3">
              {stats.recentMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{member.user.name || "N/A"}</p>
                    <p className="text-sm text-gray-500">{member.user.email}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    Joined {new Date(member.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}