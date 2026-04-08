"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { Toast, useToast } from "@/components/ui/toast"

interface OrganizationDetails {
  id: string
  name: string
  slug: string
  description: string | null
  plan: string
  status: string
  customDomain: string | null
  createdAt: string
  updatedAt: string
  suspendedAt: string | null
  _count: {
    memberships: number
    houses: number
    events: number
  }
  memberships: Array<{
    id: string
    user: {
      name: string
      email: string
    }
    organizationRole: string
    status: string
    createdAt: string
  }>
  houses: Array<{
    id: string
    name: string
    slug: string
    description: string | null
    _count: {
      members: number
    }
  }>
}

export default function OrganizationDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast, showToast, hideToast } = useToast()
  const [org, setOrg] = useState<OrganizationDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateHouse, setShowCreateHouse] = useState(false)
  const [newHouseName, setNewHouseName] = useState("")
  const [newHouseSlug, setNewHouseSlug] = useState("")
  const [newHouseDescription, setNewHouseDescription] = useState("")
  const [creating, setCreating] = useState(false)
  
  // Edit mode states
  const [isEditing, setIsEditing] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: "",
    slug: "",
    description: "",
    plan: "",
  })
  const [saving, setSaving] = useState(false)

  // Delete confirmation states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchOrganization()
  }, [])

  const fetchOrganization = async () => {
    try {
      const response = await fetch(`/api/platform/organizations/${params.orgId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch organization")
      }
      const data = await response.json()
      setOrg(data)
      // Initialize edit form data
      setEditFormData({
        name: data.name,
        slug: data.slug,
        description: data.description || "",
        plan: data.plan,
      })
    } catch (error) {
      console.error("Failed to fetch organization:", error)
      showToast("Failed to fetch organization details", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleSuspend = async () => {
    const action = org?.status === "ACTIVE" ? "suspend" : "activate"
    if (!confirm(`Are you sure you want to ${action} this organization?`)) return
    
    try {
      const response = await fetch(`/api/platform/organizations/${params.orgId}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      
      if (response.ok) {
        showToast(`Organization ${action}ed successfully!`, "success")
        fetchOrganization()
      } else {
        const error = await response.json()
        showToast(error.error || `Failed to ${action} organization`, "error")
      }
    } catch (error) {
      console.error("Failed to update organization:", error)
      showToast("Failed to update organization", "error")
    }
  }

  const handleDeleteOrganization = async () => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/platform/organizations/${params.orgId}`, {
        method: "DELETE",
      })
      
      if (response.ok) {
        showToast(`Organization "${org?.name}" and all its data have been permanently deleted.`, "success")
        setTimeout(() => {
          router.push("/platform/organizations")
        }, 1500)
      } else {
        const error = await response.json()
        showToast(error.error || "Failed to delete organization", "error")
        setShowDeleteConfirm(false)
      }
    } catch (error) {
      console.error("Failed to delete organization:", error)
      showToast("Failed to delete organization", "error")
      setShowDeleteConfirm(false)
    } finally {
      setDeleting(false)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      const response = await fetch(`/api/platform/organizations/${params.orgId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editFormData.name,
          slug: editFormData.slug,
          description: editFormData.description,
          plan: editFormData.plan,
        }),
      })
      
      if (response.ok) {
        showToast("Organization updated successfully!", "success")
        setIsEditing(false)
        fetchOrganization()
      } else {
        const error = await response.json()
        showToast(error.error || "Failed to update organization", "error")
      }
    } catch (error) {
      console.error("Failed to update organization:", error)
      showToast("Failed to update organization", "error")
    } finally {
      setSaving(false)
    }
  }

  const handleCreateHouse = async () => {
    if (!newHouseName || !newHouseSlug) {
      showToast("Please fill in house name and slug", "error")
      return
    }

    setCreating(true)
    try {
      const response = await fetch(`/api/platform/organizations/${params.orgId}/houses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newHouseName,
          slug: newHouseSlug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
          description: newHouseDescription,
        }),
      })

      if (response.ok) {
        showToast(`House "${newHouseName}" created successfully!`, "success")
        setShowCreateHouse(false)
        setNewHouseName("")
        setNewHouseSlug("")
        setNewHouseDescription("")
        fetchOrganization()
      } else {
        const error = await response.json()
        showToast(error.error || "Failed to create house", "error")
      }
    } catch (error) {
      console.error("Failed to create house:", error)
      showToast("Failed to create house", "error")
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteHouse = async (houseId: string, houseName: string) => {
    if (!confirm(`Are you sure you want to delete "${houseName}"? This action cannot be undone.`)) return
    
    try {
      const response = await fetch(`/api/platform/organizations/${params.orgId}/houses/${houseId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        showToast(`House "${houseName}" deleted successfully!`, "success")
        fetchOrganization()
      } else {
        const error = await response.json()
        showToast(error.error || "Failed to delete house", "error")
      }
    } catch (error) {
      console.error("Failed to delete house:", error)
      showToast("Failed to delete house", "error")
    }
  }

  // Auto-generate slug from house name
  const handleHouseNameChange = (name: string) => {
    setNewHouseName(name)
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    setNewHouseSlug(slug)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!org) {
    return (
      <div className="text-center py-12">
        {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
        <h2 className="text-2xl font-bold text-gray-900">Organization not found</h2>
        <Link href="/platform/organizations" className="text-blue-600 hover:text-blue-900 mt-4 inline-block">
          Back to Organizations
        </Link>
      </div>
    )
  }

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <Link href="/platform/organizations" className="text-blue-600 hover:text-blue-900 text-sm mb-2 inline-block">
            ← Back to Organizations
          </Link>
          <div className="flex items-center gap-3">
            {isEditing ? (
              <form onSubmit={handleEditSubmit} className="flex-1">
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="text-2xl font-bold text-gray-900 border rounded-md px-3 py-1 w-full max-w-md"
                    required
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editFormData.slug}
                      onChange={(e) => setEditFormData({ ...editFormData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                      className="text-gray-500 border rounded-md px-3 py-1 w-full max-w-md text-sm"
                      required
                    />
                    <select
                      value={editFormData.plan}
                      onChange={(e) => setEditFormData({ ...editFormData, plan: e.target.value })}
                      className="border rounded-md px-3 py-1 text-sm"
                    >
                      <option value="FREE">FREE</option>
                      <option value="STARTER">STARTER</option>
                      <option value="PROFESSIONAL">PROFESSIONAL</option>
                      <option value="ENTERPRISE">ENTERPRISE</option>
                    </select>
                  </div>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    className="text-gray-500 border rounded-md px-3 py-1 w-full max-w-md text-sm"
                    rows={2}
                    placeholder="Organization description"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false)
                        setEditFormData({
                          name: org.name,
                          slug: org.slug,
                          description: org.description || "",
                          plan: org.plan,
                        })
                      }}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-gray-900">{org.name}</h1>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Edit
                </button>
              </>
            )}
          </div>
          {!isEditing && <p className="text-gray-500 mt-1">Slug: {org.slug}</p>}
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700"
          >
            Delete Organization
          </button>
          <button
            onClick={handleSuspend}
            className={`px-4 py-2 rounded-md text-white ${
              org.status === "ACTIVE" 
                ? "bg-orange-600 hover:bg-orange-700" 
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {org.status === "ACTIVE" ? "Suspend Organization" : "Activate Organization"}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">Members</p>
          <p className="text-2xl font-bold text-gray-900">{org._count.memberships}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">Houses</p>
          <p className="text-2xl font-bold text-gray-900">{org._count.houses}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">Events</p>
          <p className="text-2xl font-bold text-gray-900">{org._count.events}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">Plan</p>
          <p className="text-2xl font-bold text-gray-900">{org.plan}</p>
        </div>
      </div>

      {/* Organization Info */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Organization Information</h2>
        </div>
        <div className="p-6">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="mt-1 text-sm text-gray-900">{format(new Date(org.createdAt), "MMMM d, yyyy")}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
              <dd className="mt-1 text-sm text-gray-900">{format(new Date(org.updatedAt), "MMMM d, yyyy")}</dd>
            </div>
            {org.suspendedAt && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Suspended On</dt>
                <dd className="mt-1 text-sm text-gray-900">{format(new Date(org.suspendedAt), "MMMM d, yyyy")}</dd>
              </div>
            )}
            {org.customDomain && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Custom Domain</dt>
                <dd className="mt-1 text-sm text-gray-900">{org.customDomain}</dd>
              </div>
            )}
            {org.description && (
              <div className="col-span-2">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900">{org.description}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Houses */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Houses / Chapters</h2>
          <button
            onClick={() => setShowCreateHouse(true)}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            + Add House
          </button>
        </div>
        <div className="overflow-x-auto">
          {org.houses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No houses created yet</p>
              <button
                onClick={() => setShowCreateHouse(true)}
                className="mt-2 text-blue-600 hover:text-blue-900"
              >
                Create your first house
              </button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Members</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {org.houses.map((house) => (
                  <tr key={house.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{house.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{house.slug}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {house.description || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{house._count.members}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <Link
                        href={`/org/${org.slug}/houses/${house.slug}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleDeleteHouse(house.id, house.name)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create House Modal */}
      {showCreateHouse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Create New House</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">House Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Kenya Chapter"
                  value={newHouseName}
                  onChange={(e) => handleHouseNameChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">House Slug (URL) *</label>
                <div className="flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    {org.slug}/
                  </span>
                  <input
                    type="text"
                    placeholder="kenya-chapter"
                    value={newHouseSlug}
                    onChange={(e) => setNewHouseSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="flex-1 block w-full px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Only lowercase letters, numbers, and hyphens</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">House Description (Optional)</label>
                <textarea
                  placeholder="Brief description of this house"
                  value={newHouseDescription}
                  onChange={(e) => setNewHouseDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateHouse(false)
                  setNewHouseName("")
                  setNewHouseSlug("")
                  setNewHouseDescription("")
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateHouse}
                disabled={creating || !newHouseName || !newHouseSlug}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create House"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-center mb-2">Delete Organization?</h3>
            <p className="text-gray-600 text-center mb-4">
              Are you sure you want to permanently delete <strong>{org?.name}</strong>?
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-800 font-medium mb-1">⚠️ This action cannot be undone. This will permanently delete:</p>
              <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                <li>The organization and all its data</li>
                <li>All {org?._count.houses} house(s) under this organization</li>
                <li>All {org?._count.memberships} member associations</li>
                <li>All {org?._count.events} events and tickets</li>
                <li>All related invoices and payments</li>
              </ul>
            </div>
            <p className="text-sm text-gray-500 text-center mb-4">
              Type <strong className="text-red-600">{org?.name}</strong> to confirm deletion.
            </p>
            <input
              type="text"
              placeholder={`Type "${org?.name}" to confirm`}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 mb-4"
              id="deleteConfirmInput"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const input = document.getElementById('deleteConfirmInput') as HTMLInputElement
                  if (input && input.value === org?.name) {
                    handleDeleteOrganization()
                  } else {
                    showToast(`Please type "${org?.name}" to confirm deletion`, "error")
                  }
                }}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Members */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Members</h2>
        </div>
        <div className="overflow-x-auto">
          {org.memberships.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No members yet</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {org.memberships.map((membership) => (
                  <tr key={membership.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {membership.user.name || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{membership.user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                        {membership.organizationRole}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        membership.status === "ACTIVE" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {membership.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(membership.createdAt), "MMM d, yyyy")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}