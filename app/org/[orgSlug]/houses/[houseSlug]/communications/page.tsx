"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Toast, useToast } from "@/components/ui/toast"

interface Communication {
  id: string
  subject: string
  body: string
  type: string
  status: string
  sentAt: string | null
  sentCount: number
}

export default function HouseCommunicationsPage() {
  const params = useParams()
  const orgSlug = params.orgSlug as string
  const houseSlug = params.houseSlug as string
  const { toast, showToast, hideToast } = useToast()
  const [communications, setCommunications] = useState<Communication[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newAnnouncement, setNewAnnouncement] = useState({ subject: "", body: "" })
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchCommunications()
  }, [orgSlug, houseSlug])

  const fetchCommunications = async () => {
    try {
      const response = await fetch(`/api/org/${orgSlug}/houses/${houseSlug}/communications`)
      const data = await response.json()
      setCommunications(data)
    } catch (error) {
      console.error("Failed to fetch communications:", error)
      showToast("Failed to fetch communications", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleSendAnnouncement = async () => {
    if (!newAnnouncement.subject || !newAnnouncement.body) {
      showToast("Please fill in subject and message", "error")
      return
    }

    setSending(true)
    try {
      const response = await fetch(`/api/org/${orgSlug}/houses/${houseSlug}/communications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAnnouncement),
      })

      if (response.ok) {
        showToast("Announcement sent successfully!", "success")
        setShowCreateModal(false)
        setNewAnnouncement({ subject: "", body: "" })
        fetchCommunications()
      } else {
        const error = await response.json()
        showToast(error.error || "Failed to send announcement", "error")
      }
    } catch (error) {
      showToast("Failed to send announcement", "error")
    } finally {
      setSending(false)
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
        <h1 className="text-2xl font-bold text-gray-900">House Communications</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          + Send Announcement
        </button>
      </div>

      {/* Communications List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {communications.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No communications sent yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 text-blue-600 hover:text-blue-900"
            >
              Send your first announcement
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {communications.map((comm) => (
              <div key={comm.id} className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{comm.subject}</h3>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    comm.status === "SENT" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {comm.status}
                  </span>
                </div>
                <p className="text-gray-600 mb-3">{comm.body}</p>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>Type: {comm.type}</span>
                  {comm.sentAt && (
                    <span>Sent: {format(new Date(comm.sentAt), "MMM d, yyyy h:mm a")}</span>
                  )}
                  <span>Sent to: {comm.sentCount} members</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Send Announcement Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Send Announcement</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                <input
                  type="text"
                  value={newAnnouncement.subject}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, subject: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Announcement subject"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                <textarea
                  value={newAnnouncement.body}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, body: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Your announcement message..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSendAnnouncement}
                disabled={sending}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {sending ? "Sending..." : "Send Announcement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}