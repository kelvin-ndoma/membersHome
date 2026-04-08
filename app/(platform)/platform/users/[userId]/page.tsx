"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"

interface UserDetails {
  id: string
  name: string | null
  email: string
  platformRole: string
  emailVerified: string | null
  createdAt: string
  memberships: Array<{
    id: string
    organizationRole: string
    status: string
    organization: {
      id: string
      name: string
      slug: string
    }
  }>
}

export default function UserDetailsPage() {
  const params = useParams()
  const [user, setUser] = useState<UserDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      const response = await fetch(`/api/platform/users/${params.userId}`)
      const data = await response.json()
      setUser(data)
    } catch (error) {
      console.error("Failed to fetch user:", error)
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

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">User not found</h2>
        <Link href="/platform/users" className="text-blue-600 hover:text-blue-900 mt-4 inline-block">
          Back to Users
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <Link href="/platform/users" className="text-blue-600 hover:text-blue-900 text-sm mb-2 inline-block">
          ← Back to Users
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{user.name || "Unnamed User"}</h1>
        <p className="text-gray-500">{user.email}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Info */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">User Information</h2>
          </div>
          <div className="p-6">
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Role</dt>
                <dd className={`mt-1 inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                  user.platformRole === "PLATFORM_ADMIN"
                    ? "bg-purple-100 text-purple-800"
                    : "bg-gray-100 text-gray-800"
                }`}>
                  {user.platformRole}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email Verified</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {user.emailVerified ? format(new Date(user.emailVerified), "MMMM d, yyyy") : "Not verified"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Joined</dt>
                <dd className="mt-1 text-sm text-gray-900">{format(new Date(user.createdAt), "MMMM d, yyyy")}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Organizations */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Organizations</h2>
          </div>
          <div className="p-6">
            {user.memberships.length === 0 ? (
              <p className="text-gray-500">No organizations</p>
            ) : (
              <div className="space-y-3">
                {user.memberships.map((membership) => (
                  <div key={membership.id} className="border rounded-lg p-3">
                    <Link href={`/platform/organizations/${membership.organization.id}`} className="font-medium text-blue-600 hover:text-blue-900">
                      {membership.organization.name}
                    </Link>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{membership.organizationRole}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        membership.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}>
                        {membership.status}
                      </span>
                    </div>
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