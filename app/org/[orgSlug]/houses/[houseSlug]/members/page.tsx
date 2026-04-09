"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Toast, useToast } from "@/components/ui/toast"

interface Member {
  id: string
  user: {
    id: string
    name: string
    email: string
    image: string | null
  }
  role: string
  status: string
  joinedAt: string
}

export default function HouseMembersPage() {
  const params = useParams()
  const orgSlug = params.orgSlug as string
  const houseSlug = params.houseSlug as string
  const { toast, showToast, hideToast } = useToast()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("HOUSE_MEMBER")
  const [inviting, setInviting] = useState(false)

  useEffect(() => {
    fetchMembers()
  }, [orgSlug, houseSlug])

  const fetchMembers = async () => {
    try {
      const response = await fetch(`/api/org/${orgSlug}/houses/${houseSlug}/members`)
      const data = await response.json()
      setMembers(data)
    } catch (error) {
      console.error("Failed to fetch members:", error)
      showToast("Failed to fetch members", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail) {
      showToast("Please enter an email address", "error")
      return
    }

    setInviting(true)
    try {
      const response = await fetch(`/api/org/${orgSlug}/houses/${houseSlug}/members/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })

      if (response.ok) {
        showToast(`Invitation sent to ${inviteEmail}!`, "success")
        setShowInviteModal(false)
        setInviteEmail("")
        fetchMembers()
      } else {
        const error = await response.json()
        showToast(error.error || "Failed to send invitation", "error")
      }
    } catch (error) {
      showToast("Failed to send invitation", "error")
    } finally {
      setInviting(false)
    }
  }

  const removeMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from this house?`)) return

    try {
      const response = await fetch(`/api/org/${orgSlug}/houses/${houseSlug}/members/${memberId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        showToast("Member removed successfully!", "success")
        fetchMembers()
      } else {
        showToast("Failed to remove member", "error")
      }
    } catch (error) {
      showToast("Failed to remove member", "error")
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
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">House Members</h1>
        <button
          onClick={() => setShowInviteModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          + Invite Member
        </button>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {members.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No members in this house yet</p>
            <button
              onClick={() => setShowInviteModal(true)}
              className="mt-4 text-blue-600 hover:text-blue-900"
            >
              Invite your first member
            </button>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {members.map((member) => (
                <tr key={member.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {member.user.name?.[0] || member.user.email[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{member.user.name || "N/A"}</p>
                        <p className="text-sm text-gray-500">{member.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      member.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {format(new Date(member.joinedAt), "MMM d, yyyy")}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => removeMember(member.id, member.user.name || member.user.email)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Invite Member to House</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="member@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="HOUSE_MEMBER">Member</option>
                  <option value="HOUSE_STAFF">Staff</option>
                  <option value="HOUSE_MANAGER">Manager</option>
                  <option value="HOUSE_ADMIN">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                disabled={inviting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {inviting ? "Sending..." : "Send Invitation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}