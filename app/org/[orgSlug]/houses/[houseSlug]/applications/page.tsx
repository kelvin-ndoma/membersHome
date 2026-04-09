"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Toast, useToast } from "@/components/ui/toast"

interface Application {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  company: string | null
  position: string | null
  status: string
  notes: string | null
  createdAt: string
  membershipPlan: {
    name: string
  }
}

export default function HouseApplicationsPage() {
  const params = useParams()
  const orgSlug = params.orgSlug as string
  const houseSlug = params.houseSlug as string
  const { toast, showToast, hideToast } = useToast()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    fetchApplications()
  }, [orgSlug, houseSlug, filter])

  const fetchApplications = async () => {
    try {
      const response = await fetch(`/api/org/${orgSlug}/houses/${houseSlug}/applications?status=${filter}`)
      const data = await response.json()
      setApplications(data)
    } catch (error) {
      console.error("Failed to fetch applications:", error)
      showToast("Failed to fetch applications", "error")
    } finally {
      setLoading(false)
    }
  }

  const updateApplicationStatus = async (applicationId: string, status: string, rejectionReason?: string) => {
    try {
      const response = await fetch(`/api/org/${orgSlug}/houses/${houseSlug}/applications/${applicationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, rejectionReason }),
      })

      if (response.ok) {
        showToast(`Application ${status.toLowerCase()} successfully!`, "success")
        setSelectedApp(null)
        setRejectionReason("")
        fetchApplications()
      } else {
        const error = await response.json()
        showToast(error.error || "Failed to update application", "error")
      }
    } catch (error) {
      showToast("Failed to update application", "error")
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
        <h1 className="text-2xl font-bold text-gray-900">Membership Applications</h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex gap-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Applications</option>
            <option value="PENDING">Pending</option>
            <option value="REVIEWING">Under Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {applications.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No applications found</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {applications.map((app) => (
                <tr key={app.id}>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{app.firstName} {app.lastName}</p>
                      <p className="text-sm text-gray-500">{app.email}</p>
                      {app.company && <p className="text-xs text-gray-400">{app.company}</p>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {app.membershipPlan?.name || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {format(new Date(app.createdAt), "MMM d, yyyy")}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      app.status === "APPROVED" ? "bg-green-100 text-green-800" :
                      app.status === "REJECTED" ? "bg-red-100 text-red-800" :
                      app.status === "REVIEWING" ? "bg-blue-100 text-blue-800" :
                      "bg-yellow-100 text-yellow-800"
                    }`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => setSelectedApp(app)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Review Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Review Application</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">First Name</label>
                  <p className="text-gray-900">{selectedApp.firstName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Last Name</label>
                  <p className="text-gray-900">{selectedApp.lastName}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Email</label>
                <p className="text-gray-900">{selectedApp.email}</p>
              </div>
              
              {selectedApp.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-gray-900">{selectedApp.phone}</p>
                </div>
              )}
              
              {selectedApp.company && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Company</label>
                  <p className="text-gray-900">{selectedApp.company}</p>
                </div>
              )}
              
              {selectedApp.position && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Position</label>
                  <p className="text-gray-900">{selectedApp.position}</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Membership Plan</label>
                <p className="text-gray-900">{selectedApp.membershipPlan?.name}</p>
              </div>
              
              {selectedApp.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Additional Notes</label>
                  <p className="text-gray-900">{selectedApp.notes}</p>
                </div>
              )}
            </div>

            {selectedApp.status === "PENDING" || selectedApp.status === "REVIEWING" ? (
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason (if rejecting)</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Optional reason for rejection"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => updateApplicationStatus(selectedApp.id, "REVIEWING")}
                    className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50"
                  >
                    Mark as Reviewing
                  </button>
                  <button
                    onClick={() => updateApplicationStatus(selectedApp.id, "APPROVED")}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => updateApplicationStatus(selectedApp.id, "REJECTED", rejectionReason)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setSelectedApp(null)}
                  className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}