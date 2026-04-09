"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Toast, useToast } from "@/components/ui/toast"

interface PlanPrice {
  id: string
  billingFrequency: string
  amount: number
  currency: string
  setupFee: number | null
  vatRate: number | null
}

interface MembershipPlan {
  id: string
  name: string
  description: string | null
  type: string
  status: string
  isPublic: boolean
  requiresApproval: boolean
  features: string[]
  prices: PlanPrice[]
}

export default function HousePlansPage() {
  const params = useParams()
  const orgSlug = params.orgSlug as string
  const houseSlug = params.houseSlug as string
  const { toast, showToast, hideToast } = useToast()
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newPlan, setNewPlan] = useState({
    name: "",
    description: "",
    disclaimer: "",
    type: "STANDARD",
    isPublic: true,
    requiresApproval: false,
    features: [] as string[],
    prices: [] as Array<{
      billingFrequency: string
      amount: number
      setupFee: number
      vatRate: number
    }>
  })

  useEffect(() => {
    fetchPlans()
  }, [orgSlug, houseSlug])

  const fetchPlans = async () => {
    try {
      setLoading(true)
      setError(null)
      const url = `/api/org/${orgSlug}/houses/${houseSlug}/plans`
      console.log("Fetching plans from:", url)
      
      const response = await fetch(url)
      console.log("Response status:", response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error response:", errorText)
        throw new Error(`Failed to fetch plans: ${response.status}`)
      }
      
      const data = await response.json()
      console.log("Fetched plans data:", data)
      setPlans(data)
    } catch (error) {
      console.error("Failed to fetch plans:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch membership plans")
      showToast("Failed to fetch membership plans", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePlan = async () => {
    if (!newPlan.name) {
      showToast("Plan name is required", "error")
      return
    }

    if (newPlan.prices.length === 0) {
      showToast("At least one price option is required", "error")
      return
    }

    setCreating(true)
    try {
      const response = await fetch(`/api/org/${orgSlug}/houses/${houseSlug}/plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPlan),
      })

      if (response.ok) {
        showToast(`Plan "${newPlan.name}" created successfully!`, "success")
        setShowCreateModal(false)
        setNewPlan({
          name: "",
          description: "",
          disclaimer: "",
          type: "STANDARD",
          isPublic: true,
          requiresApproval: false,
          features: [],
          prices: []
        })
        fetchPlans()
      } else {
        const error = await response.json()
        showToast(error.error || "Failed to create plan", "error")
      }
    } catch (error) {
      showToast("Failed to create plan", "error")
    } finally {
      setCreating(false)
    }
  }

  const updatePlanStatus = async (planId: string, status: string) => {
    try {
      const response = await fetch(`/api/org/${orgSlug}/houses/${houseSlug}/plans/${planId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        showToast(`Plan ${status.toLowerCase()} successfully!`, "success")
        fetchPlans()
      } else {
        showToast("Failed to update plan status", "error")
      }
    } catch (error) {
      showToast("Failed to update plan status", "error")
    }
  }

  const deletePlan = async (planId: string, planName: string) => {
    if (!confirm(`Are you sure you want to delete "${planName}"? This will also delete all associated memberships.`)) return

    try {
      const response = await fetch(`/api/org/${orgSlug}/houses/${houseSlug}/plans/${planId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        showToast(`Plan "${planName}" deleted successfully!`, "success")
        fetchPlans()
      } else {
        showToast("Failed to delete plan", "error")
      }
    } catch (error) {
      showToast("Failed to delete plan", "error")
    }
  }

  const addPrice = () => {
    setNewPlan({
      ...newPlan,
      prices: [...newPlan.prices, { billingFrequency: "MONTHLY", amount: 0, setupFee: 0, vatRate: 0 }]
    })
  }

  const updatePrice = (index: number, field: string, value: any) => {
    const updatedPrices = [...newPlan.prices]
    updatedPrices[index] = { ...updatedPrices[index], [field]: value }
    setNewPlan({ ...newPlan, prices: updatedPrices })
  }

  const removePrice = (index: number) => {
    setNewPlan({
      ...newPlan,
      prices: newPlan.prices.filter((_, i) => i !== index)
    })
  }

  const addFeature = () => {
    setNewPlan({ ...newPlan, features: [...newPlan.features, ""] })
  }

  const updateFeature = (index: number, value: string) => {
    const updatedFeatures = [...newPlan.features]
    updatedFeatures[index] = value
    setNewPlan({ ...newPlan, features: updatedFeatures })
  }

  const removeFeature = (index: number) => {
    setNewPlan({
      ...newPlan,
      features: newPlan.features.filter((_, i) => i !== index)
    })
  }

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      MONTHLY: "Monthly",
      QUARTERLY: "Quarterly",
      SEMI_ANNUAL: "Semi-Annual",
      ANNUAL: "Annual"
    }
    return labels[frequency] || frequency
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => fetchPlans()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Membership Plans</h1>
          <p className="text-gray-500 mt-1">Create and manage membership plans with recurring billing</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Plan
        </button>
      </div>

      {/* Plans Grid */}
      {plans.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-6xl mb-4">🎫</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No membership plans yet</h3>
          <p className="text-gray-500 mb-4">Create your first membership plan to start accepting members</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-blue-600 hover:text-blue-700"
          >
            Create Plan →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{plan.type}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    plan.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                  }`}>
                    {plan.status}
                  </span>
                </div>

                {plan.description && (
                  <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                )}

                {/* Pricing Options */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">Pricing Options</p>
                  <div className="space-y-2">
                    {plan.prices.map((price) => (
                      <div key={price.id} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">{getFrequencyLabel(price.billingFrequency)}</span>
                        <div className="text-right">
                          <span className="font-semibold text-gray-900">${price.amount}</span>
                          {(price.setupFee ?? 0) > 0 && (
                            <span className="text-xs text-gray-500 ml-2">+ ${price.setupFee} setup</span>
                          )}
                          {(price.vatRate ?? 0) > 0 && (
                            <span className="text-xs text-gray-500 ml-2">+{price.vatRate}% VAT</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Features */}
                {plan.features.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">Features</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {plan.features.slice(0, 3).map((feature, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                      {plan.features.length > 3 && (
                        <li className="text-gray-400">+{plan.features.length - 3} more features</li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {plan.isPublic && (
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Public</span>
                  )}
                  {plan.requiresApproval && (
                    <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Requires Approval</span>
                  )}
                  {plan.prices.some(p => (p.setupFee ?? 0) > 0) && (
                    <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">Setup Fee</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 justify-between items-center pt-4 border-t border-gray-100">
                  <div className="flex gap-2">
                    {plan.status === "DRAFT" && (
                      <button
                        onClick={() => updatePlanStatus(plan.id, "ACTIVE")}
                        className="text-xs text-green-600 hover:text-green-800 font-medium"
                      >
                        Activate
                      </button>
                    )}
                    {plan.status === "ACTIVE" && (
                      <button
                        onClick={() => updatePlanStatus(plan.id, "INACTIVE")}
                        className="text-xs text-orange-600 hover:text-orange-800 font-medium"
                      >
                        Deactivate
                      </button>
                    )}
                    <Link
                      href={`/org/${orgSlug}/houses/${houseSlug}/plans/${plan.id}/applications`}
                      className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                    >
                      View Applications
                    </Link>
                    <Link
                      href={`/org/${orgSlug}/houses/${houseSlug}/plans/${plan.id}/members`}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Members
                    </Link>
                  </div>
                  <div className="flex gap-3">
                    <Link
                      href={`/org/${orgSlug}/houses/${houseSlug}/plans/${plan.id}/edit`}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => deletePlan(plan.id, plan.name)}
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

      {/* Create Plan Modal - same as before */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Create Membership Plan</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name *</label>
                  <input
                    type="text"
                    value={newPlan.name}
                    onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Premium Membership"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan Type</label>
                  <select
                    value={newPlan.type}
                    onChange={(e) => setNewPlan({ ...newPlan, type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="STANDARD">Standard</option>
                    <option value="PREMIUM">Premium</option>
                    <option value="VIP">VIP</option>
                    <option value="CUSTOM">Custom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newPlan.description}
                  onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe what this plan includes"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Disclaimer / Terms</label>
                <textarea
                  value={newPlan.disclaimer}
                  onChange={(e) => setNewPlan({ ...newPlan, disclaimer: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Terms, conditions, cancellation policy, etc."
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Pricing Options *</label>
                  <button type="button" onClick={addPrice} className="text-sm text-blue-600 hover:text-blue-800">
                    + Add Billing Frequency
                  </button>
                </div>
                {newPlan.prices.map((price, index) => (
                  <div key={index} className="border rounded-lg p-4 mb-3">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-gray-700">Option {index + 1}</span>
                      {newPlan.prices.length > 1 && (
                        <button type="button" onClick={() => removePrice(index)} className="text-red-600 hover:text-red-800 text-sm">
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Billing Frequency</label>
                        <select
                          value={price.billingFrequency}
                          onChange={(e) => updatePrice(index, "billingFrequency", e.target.value)}
                          className="w-full px-3 py-2 border rounded-md text-sm"
                        >
                          <option value="MONTHLY">Monthly</option>
                          <option value="QUARTERLY">Quarterly</option>
                          <option value="SEMI_ANNUAL">Semi-Annual</option>
                          <option value="ANNUAL">Annual</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Amount ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={price.amount}
                          onChange={(e) => updatePrice(index, "amount", parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border rounded-md text-sm"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Setup Fee ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={price.setupFee}
                          onChange={(e) => updatePrice(index, "setupFee", parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border rounded-md text-sm"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">VAT Rate (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={price.vatRate}
                          onChange={(e) => updatePrice(index, "vatRate", parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border rounded-md text-sm"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Features Included</label>
                  <button type="button" onClick={addFeature} className="text-sm text-blue-600 hover:text-blue-800">
                    + Add Feature
                  </button>
                </div>
                {newPlan.features.map((feature, index) => (
                  <div key={index} className="flex gap-3 mb-3">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => updateFeature(index, e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Access to all events"
                    />
                    <button type="button" onClick={() => removeFeature(index)} className="text-red-600 hover:text-red-800">
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newPlan.isPublic}
                    onChange={(e) => setNewPlan({ ...newPlan, isPublic: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Public Plan (visible to all)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newPlan.requiresApproval}
                    onChange={(e) => setNewPlan({ ...newPlan, requiresApproval: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Requires Approval for New Members</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePlan}
                disabled={creating}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Plan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}