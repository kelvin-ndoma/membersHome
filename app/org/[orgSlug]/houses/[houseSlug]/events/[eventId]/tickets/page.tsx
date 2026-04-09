"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { Toast, useToast } from "@/components/ui/toast"

interface Ticket {
  id: string
  name: string
  description: string | null
  type: string
  price: number
  currency: string
  earlyBirdPrice: number | null
  memberPrice: number | null
  publicPrice: number | null
  totalQuantity: number
  soldQuantity: number
  reservedQuantity: number
  maxPerPurchase: number
  memberOnly: boolean
  requiresApproval: boolean
  salesStartAt: string
  salesEndAt: string
  validFrom: string
  validUntil: string
  isPublic: boolean
  isRefundable: boolean
  refundDeadline: string | null
  status: string
}

interface EventDetails {
  id: string
  title: string
  isFree: boolean
  price: number
}

export default function EventTicketsPage() {
  const params = useParams()
  const orgSlug = params.orgSlug as string
  const houseSlug = params.houseSlug as string
  const eventId = params.eventId as string
  const { toast, showToast, hideToast } = useToast()
  
  const [event, setEvent] = useState<EventDetails | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newTicket, setNewTicket] = useState({
    name: "",
    description: "",
    type: "GENERAL_ADMISSION",
    price: 0,
    totalQuantity: 100,
    maxPerPurchase: 10,
    memberOnly: false,
    requiresApproval: false,
    salesStartAt: "",
    salesEndAt: "",
    validFrom: "",
    validUntil: "",
    isPublic: true,
    isRefundable: true,
  })

  useEffect(() => {
    fetchEvent()
    fetchTickets()
  }, [])

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/org/${orgSlug}/houses/${houseSlug}/events/${eventId}`)
      const data = await response.json()
      setEvent(data)
    } catch (error) {
      console.error("Failed to fetch event:", error)
    }
  }

  const fetchTickets = async () => {
    try {
      const response = await fetch(`/api/org/${orgSlug}/houses/${houseSlug}/events/${eventId}/tickets`)
      const data = await response.json()
      setTickets(data)
    } catch (error) {
      console.error("Failed to fetch tickets:", error)
      showToast("Failed to fetch tickets", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTicket = async () => {
    if (!newTicket.name || !newTicket.salesStartAt || !newTicket.salesEndAt || !newTicket.validFrom || !newTicket.validUntil) {
      showToast("Please fill in all required fields", "error")
      return
    }

    setCreating(true)
    try {
      const response = await fetch(`/api/org/${orgSlug}/houses/${houseSlug}/events/${eventId}/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTicket),
      })

      if (response.ok) {
        showToast("Ticket created successfully!", "success")
        setShowCreateModal(false)
        setNewTicket({
          name: "",
          description: "",
          type: "GENERAL_ADMISSION",
          price: 0,
          totalQuantity: 100,
          maxPerPurchase: 10,
          memberOnly: false,
          requiresApproval: false,
          salesStartAt: "",
          salesEndAt: "",
          validFrom: "",
          validUntil: "",
          isPublic: true,
          isRefundable: true,
        })
        fetchTickets()
      } else {
        const error = await response.json()
        showToast(error.error || "Failed to create ticket", "error")
      }
    } catch (error) {
      showToast("Failed to create ticket", "error")
    } finally {
      setCreating(false)
    }
  }

  const updateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const response = await fetch(`/api/org/${orgSlug}/houses/${houseSlug}/events/${eventId}/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        showToast(`Ticket ${status.toLowerCase()} successfully!`, "success")
        fetchTickets()
      } else {
        showToast("Failed to update ticket status", "error")
      }
    } catch (error) {
      showToast("Failed to update ticket status", "error")
    }
  }

  const deleteTicket = async (ticketId: string, ticketName: string) => {
    if (!confirm(`Are you sure you want to delete "${ticketName}"? This will also delete all purchases.`)) return

    try {
      const response = await fetch(`/api/org/${orgSlug}/houses/${houseSlug}/events/${eventId}/tickets/${ticketId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        showToast(`Ticket "${ticketName}" deleted successfully!`, "success")
        fetchTickets()
      } else {
        showToast("Failed to delete ticket", "error")
      }
    } catch (error) {
      showToast("Failed to delete ticket", "error")
    }
  }

  const getTicketTypeBadge = (type: string) => {
    const types: Record<string, string> = {
      GENERAL_ADMISSION: "General Admission",
      VIP: "VIP",
      EARLY_BIRD: "Early Bird",
      GROUP: "Group",
      SEASON_PASS: "Season Pass",
      WORKSHOP: "Workshop",
      COURSE: "Course",
      DONATION: "Donation",
      CUSTOM: "Custom",
    }
    return types[type] || type
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800"
      case "DRAFT":
        return "bg-gray-100 text-gray-800"
      case "SOLD_OUT":
        return "bg-orange-100 text-orange-800"
      case "EXPIRED":
        return "bg-gray-100 text-gray-800"
      case "CANCELLED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
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
          <Link
            href={`/org/${orgSlug}/houses/${houseSlug}/events`}
            className="text-sm text-blue-600 hover:text-blue-800 mb-2 inline-block"
          >
            ← Back to Events
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Ticket Management</h1>
          <p className="text-gray-500 mt-1">Manage tickets for: <span className="font-medium text-gray-700">{event?.title}</span></p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Ticket
        </button>
      </div>

      {/* Tickets Grid */}
      {tickets.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-6xl mb-4">🎫</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets yet</h3>
          <p className="text-gray-500 mb-4">Create your first ticket to start selling</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-blue-600 hover:text-blue-700"
          >
            Create Ticket →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{ticket.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{getTicketTypeBadge(ticket.type)}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(ticket.status)}`}>
                    {ticket.status}
                  </span>
                </div>

                {ticket.description && (
                  <p className="text-sm text-gray-600 mb-4">{ticket.description}</p>
                )}

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Price</p>
                    <p className="text-lg font-bold text-gray-900">
                      {event?.isFree ? "Free" : `$${ticket.price}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Quantity</p>
                    <p className="text-lg font-bold text-gray-900">
                      {ticket.soldQuantity} / {ticket.totalQuantity} sold
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full"
                        style={{ width: `${(ticket.soldQuantity / ticket.totalQuantity) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <span>📅</span>
                    <span>Sales: {format(new Date(ticket.salesStartAt), "MMM d, yyyy")} - {format(new Date(ticket.salesEndAt), "MMM d, yyyy")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>✓</span>
                    <span>Valid: {format(new Date(ticket.validFrom), "MMM d, yyyy")} - {format(new Date(ticket.validUntil), "MMM d, yyyy")}</span>
                  </div>
                  {ticket.memberOnly && (
                    <div className="flex items-center gap-2 text-yellow-600">
                      <span>🔒</span>
                      <span>Members Only</span>
                    </div>
                  )}
                  {ticket.requiresApproval && (
                    <div className="flex items-center gap-2 text-orange-600">
                      <span>⏳</span>
                      <span>Requires Approval</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 justify-between items-center pt-4 border-t border-gray-100">
                  <div className="flex gap-2">
                    {ticket.status === "DRAFT" && (
                      <button
                        onClick={() => updateTicketStatus(ticket.id, "ACTIVE")}
                        className="text-xs text-green-600 hover:text-green-800 font-medium"
                      >
                        Activate
                      </button>
                    )}
                    {ticket.status === "ACTIVE" && (
                      <button
                        onClick={() => updateTicketStatus(ticket.id, "CANCELLED")}
                        className="text-xs text-red-600 hover:text-red-800 font-medium"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <Link
                      href={`/org/${orgSlug}/houses/${houseSlug}/events/${eventId}/tickets/${ticket.id}/purchases`}
                      className="text-sm text-purple-600 hover:text-purple-800"
                    >
                      View Purchases
                    </Link>
                    <button
                      onClick={() => deleteTicket(ticket.id, ticket.name)}
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

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Create New Ticket</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Name *</label>
                  <input
                    type="text"
                    value={newTicket.name}
                    onChange={(e) => setNewTicket({ ...newTicket, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="General Admission"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Type *</label>
                  <select
                    value={newTicket.type}
                    onChange={(e) => setNewTicket({ ...newTicket, type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="GENERAL_ADMISSION">General Admission</option>
                    <option value="VIP">VIP</option>
                    <option value="EARLY_BIRD">Early Bird</option>
                    <option value="GROUP">Group</option>
                    <option value="SEASON_PASS">Season Pass</option>
                    <option value="WORKSHOP">Workshop</option>
                    <option value="COURSE">Course</option>
                    <option value="DONATION">Donation</option>
                    <option value="CUSTOM">Custom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe what this ticket includes"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newTicket.price}
                    onChange={(e) => setNewTicket({ ...newTicket, price: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    value={newTicket.totalQuantity}
                    onChange={(e) => setNewTicket({ ...newTicket, totalQuantity: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Per Purchase</label>
                  <input
                    type="number"
                    min="1"
                    value={newTicket.maxPerPurchase}
                    onChange={(e) => setNewTicket({ ...newTicket, maxPerPurchase: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sales Start Date *</label>
                  <input
                    type="datetime-local"
                    value={newTicket.salesStartAt}
                    onChange={(e) => setNewTicket({ ...newTicket, salesStartAt: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sales End Date *</label>
                  <input
                    type="datetime-local"
                    value={newTicket.salesEndAt}
                    onChange={(e) => setNewTicket({ ...newTicket, salesEndAt: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valid From *</label>
                  <input
                    type="datetime-local"
                    value={newTicket.validFrom}
                    onChange={(e) => setNewTicket({ ...newTicket, validFrom: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until *</label>
                  <input
                    type="datetime-local"
                    value={newTicket.validUntil}
                    onChange={(e) => setNewTicket({ ...newTicket, validUntil: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newTicket.memberOnly}
                    onChange={(e) => setNewTicket({ ...newTicket, memberOnly: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Members Only</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newTicket.requiresApproval}
                    onChange={(e) => setNewTicket({ ...newTicket, requiresApproval: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Requires Approval</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newTicket.isPublic}
                    onChange={(e) => setNewTicket({ ...newTicket, isPublic: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Public (visible to everyone)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newTicket.isRefundable}
                    onChange={(e) => setNewTicket({ ...newTicket, isRefundable: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Refundable</span>
                </label>
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
                onClick={handleCreateTicket}
                disabled={creating}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Ticket"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}