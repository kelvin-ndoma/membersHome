"use client"

import { useSession } from "next-auth/react"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"

interface DashboardStats {
  totalMembers: number
  totalHouses: number
  totalEvents: number
  upcomingEvents: Array<{
    id: string
    title: string
    startDate: string
    location: string
  }>
  recentMembers: Array<{
    id: string
    user: {
      name: string
      email: string
    }
    createdAt: string
  }>
}

export default function OrgDashboardPage() {
  const { data: session } = useSession()
  const params = useParams()
  const orgSlug = params.orgSlug as string
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (orgSlug) {
      fetchDashboardStats()
    }
  }, [orgSlug])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch(`/api/org/dashboard?orgSlug=${orgSlug}`)
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error)
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
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        Welcome back, {session?.user?.name || "Organization Owner"}!
      </h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <span className="text-2xl">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total Members</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalMembers || 0}</p>
            </div>
          </div>
          <Link href={`/org/${orgSlug}/members`} className="text-sm text-blue-600 hover:text-blue-800 mt-3 inline-block">
            View all members →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <span className="text-2xl">🏠</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Houses</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalHouses || 0}</p>
            </div>
          </div>
          <Link href={`/org/${orgSlug}/houses`} className="text-sm text-blue-600 hover:text-blue-800 mt-3 inline-block">
            Manage houses →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <span className="text-2xl">📅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total Events</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalEvents || 0}</p>
            </div>
          </div>
          <Link href={`/org/${orgSlug}/events`} className="text-sm text-blue-600 hover:text-blue-800 mt-3 inline-block">
            Manage events →
          </Link>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
          <Link href={`/org/${orgSlug}/events/create`} className="text-sm text-blue-600 hover:text-blue-800">
            + Create Event
          </Link>
        </div>
        <div className="p-6">
          {stats?.upcomingEvents?.length === 0 ? (
            <p className="text-gray-500 text-center">No upcoming events. Create your first event!</p>
          ) : (
            <div className="space-y-4">
              {stats?.upcomingEvents?.map((event) => (
                <div key={event.id} className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h3 className="font-medium text-gray-900">{event.title}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(event.startDate).toLocaleDateString()} • {event.location || "Online"}
                    </p>
                  </div>
                  <Link href={`/org/${orgSlug}/events/${event.id}`} className="text-blue-600 hover:text-blue-800 text-sm">
                    View →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-6 space-y-3">
            <Link
              href={`/org/${orgSlug}/members/invite`}
              className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Invite New Member
            </Link>
            <Link
              href={`/org/${orgSlug}/houses/create`}
              className="block w-full text-center px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50"
            >
              Create New House
            </Link>
            <Link
              href={`/org/${orgSlug}/events/create`}
              className="block w-full text-center px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50"
            >
              Create New Event
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Recent Members</h2>
          </div>
          <div className="p-6">
            {stats?.recentMembers?.length === 0 ? (
              <p className="text-gray-500 text-center">No members yet. Invite your first member!</p>
            ) : (
              <div className="space-y-3">
                {stats?.recentMembers?.slice(0, 5).map((member) => (
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
    </div>
  )
}