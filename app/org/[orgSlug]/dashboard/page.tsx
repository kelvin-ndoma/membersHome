"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"

interface House {
  id: string
  name: string
  slug: string
  description: string | null
  _count: {
    members: number
    events: number
  }
}

export default function OrgDashboardPage() {
  const params = useParams()
  const orgSlug = params.orgSlug as string
  const [houses, setHouses] = useState<House[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHouses()
  }, [orgSlug])

  const fetchHouses = async () => {
    try {
      const response = await fetch(`/api/org/${orgSlug}/houses`)
      const data = await response.json()
      setHouses(data)
    } catch (error) {
      console.error("Failed to fetch houses:", error)
    } finally {
      setLoading(false)
    }
  }

  const totalMembers = houses.reduce((sum, house) => sum + house._count.members, 0)
  const totalEvents = houses.reduce((sum, house) => sum + house._count.events, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl shadow-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Organization Dashboard</h1>
        <p className="text-blue-100">Manage all your houses and their activities from one place</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Houses</p>
              <p className="text-3xl font-bold text-gray-900">{houses.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🏠</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-blue-600 h-1.5 rounded-full" 
                style={{ width: `${Math.min((houses.length / 10) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-400 mt-2">{houses.length} active house(s)</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Members</p>
              <p className="text-3xl font-bold text-gray-900">{totalMembers}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-green-600 h-1.5 rounded-full" 
                style={{ width: `${Math.min((totalMembers / 1000) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-400 mt-2">across all houses</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Events</p>
              <p className="text-3xl font-bold text-gray-900">{totalEvents}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📅</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-purple-600 h-1.5 rounded-full" 
                style={{ width: `${Math.min((totalEvents / 500) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-400 mt-2">scheduled and completed</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Avg. Members/House</p>
              <p className="text-3xl font-bold text-gray-900">
                {houses.length > 0 ? Math.round(totalMembers / houses.length) : 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-orange-600 h-1.5 rounded-full" 
                style={{ width: `${Math.min(((totalMembers / houses.length) / 100) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-400 mt-2">per house average</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href={`/org/${orgSlug}/houses`}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition group"
          >
            <div>
              <p className="font-medium text-gray-900">View All Houses</p>
              <p className="text-sm text-gray-500">Manage your houses</p>
            </div>
            <span className="text-gray-400 group-hover:text-blue-600 transition">→</span>
          </Link>
          <Link
            href={`/org/${orgSlug}/settings`}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition group"
          >
            <div>
              <p className="font-medium text-gray-900">Organization Settings</p>
              <p className="text-sm text-gray-500">Update your org details</p>
            </div>
            <span className="text-gray-400 group-hover:text-blue-600 transition">→</span>
          </Link>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Need Help?</p>
              <p className="text-sm text-gray-500">Contact support</p>
            </div>
            <span className="text-gray-400">📧</span>
          </div>
        </div>
      </div>

      {/* Houses Overview */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Your Houses</h2>
          <Link href={`/org/${orgSlug}/houses`} className="text-sm text-blue-600 hover:text-blue-800">
            View All →
          </Link>
        </div>
        
        {houses.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="text-6xl mb-4">🏠</div>
            <p className="text-gray-500 mb-2">No houses created yet</p>
            <p className="text-sm text-gray-400">Only platform admins can create houses. Contact support.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {houses.slice(0, 4).map((house) => (
              <Link
                key={house.id}
                href={`/org/${orgSlug}/houses/${house.slug}/dashboard`}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition cursor-pointer block"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">🏠</span>
                      <h3 className="text-lg font-semibold text-gray-900">{house.name}</h3>
                    </div>
                    {house.description && (
                      <p className="text-sm text-gray-500 mb-4 line-clamp-2">{house.description}</p>
                    )}
                    <div className="flex gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">👥</span>
                        <span className="text-gray-600">{house._count.members} members</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">📅</span>
                        <span className="text-gray-600">{house._count.events} events</span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600">→</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Tips Section */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xl">💡</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Pro Tip</h3>
            <p className="text-sm text-gray-600">
              Click on any house to access its dashboard and start managing members, events, and membership plans.
              Each house has its own separate management system.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}