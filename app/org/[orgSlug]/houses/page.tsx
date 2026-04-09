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

export default function HousesPage() {
  const params = useParams()
  const orgSlug = params.orgSlug as string
  const [houses, setHouses] = useState<House[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

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

  const filteredHouses = houses.filter(house =>
    house.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (house.description && house.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl shadow-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Houses / Chapters</h1>
        <p className="text-green-100">Select a house to manage its members, events, and settings</p>
      </div>

      {/* Stats Summary */}
      {houses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Houses</p>
                <p className="text-2xl font-bold text-gray-900">{houses.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">🏠</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Members</p>
                <p className="text-2xl font-bold text-gray-900">
                  {houses.reduce((sum, h) => sum + h._count.members, 0)}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">👥</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Events</p>
                <p className="text-2xl font-bold text-gray-900">
                  {houses.reduce((sum, h) => sum + h._count.events, 0)}
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">📅</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      {houses.length > 0 && (
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search houses by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
          />
        </div>
      )}

      {/* Houses Grid */}
      {houses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center">
          <div className="text-6xl mb-4">🏠</div>
          <p className="text-gray-500 mb-2 text-lg">No houses found</p>
          <p className="text-sm text-gray-400">Only platform admins can create houses. Contact support for assistance.</p>
        </div>
      ) : filteredHouses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-gray-500 mb-2 text-lg">No matching houses</p>
          <p className="text-sm text-gray-400">Try adjusting your search terms</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHouses.map((house) => (
            <Link
              key={house.id}
              href={`/org/${orgSlug}/houses/${house.slug}/dashboard`}
              className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer block transform hover:-translate-y-1"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <span className="text-white text-lg">🏠</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition">
                      {house.name}
                    </h3>
                  </div>
                  <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-blue-50 transition">
                    <span className="text-gray-400 group-hover:text-blue-600 text-sm">→</span>
                  </div>
                </div>
                
                {house.description && (
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{house.description}</p>
                )}
                
                <div className="flex items-center gap-4 pt-3 border-t border-gray-50">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 bg-green-50 rounded-full flex items-center justify-center">
                      <span className="text-xs text-green-600">👥</span>
                    </div>
                    <span className="text-sm text-gray-600">{house._count.members} members</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 bg-purple-50 rounded-full flex items-center justify-center">
                      <span className="text-xs text-purple-600">📅</span>
                    </div>
                    <span className="text-sm text-gray-600">{house._count.events} events</span>
                  </div>
                </div>

                {/* Progress indicators */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Activity</span>
                    <span>{Math.min(Math.round((house._count.members / 100) * 100), 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((house._count.members / 100) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Quick Tip */}
      {houses.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-sm">💡</span>
            </div>
            <p className="text-sm text-gray-700">
              Click on any house to access its full management dashboard including members, events, and membership plans.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}