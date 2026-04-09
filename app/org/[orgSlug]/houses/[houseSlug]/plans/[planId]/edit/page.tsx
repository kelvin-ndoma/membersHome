"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
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

export default function EditPlanPage() {
  const params = useParams()
  const router = useRouter()
  const orgSlug = params.orgSlug as string
  const houseSlug = params.houseSlug as string
  const planId = params.planId as string
  const { toast, showToast, hideToast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [plan, setPlan] = useState<MembershipPlan | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "STANDARD",
    isPublic: true,
    requiresApproval: false,
    features: [] as string[],
    prices: [] as Array<{
      id?: string
      billingFrequency: string
      amount: number
      setupFee: number
      vatRate: number
    }>
  })

  useEffect(() => {
    fetchPlan()
  }, [])

  const fetchPlan = async () => {
    try {
      const response = await fetch(`/api/org/${orgSlug}/houses/${houseSlug}/plans/${planId}`)
      if (!response.ok) throw new Error("Failed to fetch plan")
      const data = await response.json()
      setPlan(data)
      setFormData({
        name: data.name,
        description: data.description || "",
        type: data.type,
        isPublic: data.isPublic,
        requiresApproval: data.requiresApproval,
        features: data.features || [],
        prices: data.prices.map((price: PlanPrice) => ({
          id: price.id,
          billingFrequency: price.billingFrequency,
          amount: price.amount,
          setupFee: price.setupFee ?? 0,
          vatRate: price.vatRate ?? 0,
        }))
      })
    } catch (error) {
      console.error("Failed to fetch plan:", error)
      showToast("Failed to fetch plan details", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name) {
      showToast("Plan name is required", "error")
      return
    }

    if (formData.prices.length === 0) {
      showToast("At least one price option is required", "error")
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/org/${orgSlug}/houses/${houseSlug}/plans/${planId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        showToast("Plan updated successfully!", "success")
        setTimeout(() => {
          router.push(`/org/${orgSlug}/houses/${houseSlug}/plans`)
          router.refresh()
        }, 1500)
      } else {
        const error = await response.json()
        showToast(error.error || "Failed to update plan", "error")
      }
    } catch (error) {
      showToast("Failed to update plan", "error")
    } finally {
      setSaving(false)
    }
  }

  const addPrice = () => {
    setFormData({
      ...formData,
      prices: [...formData.prices, { billingFrequency: "MONTHLY", amount: 0, setupFee: 0, vatRate: 0 }]
    })
  }

  const updatePrice = (index: number, field: string, value: any) => {
    const updatedPrices = [...formData.prices]
    updatedPrices[index] = { ...updatedPrices[index], [field]: value }
    setFormData({ ...formData, prices: updatedPrices })
  }

  const removePrice = (index: number) => {
    setFormData({
      ...formData,
      prices: formData.prices.filter((_, i) => i !== index)
    })
  }

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ""] })
  }

  const updateFeature = (index: number, value: string) => {
    const updatedFeatures = [...formData.features]
    updatedFeatures[index] = value
    setFormData({ ...formData, features: updatedFeatures })
  }

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index)
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

  if (!plan) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Plan not found</h2>
        <button
          onClick={() => router.back()}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          Go Back
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="text-gray-500 hover:text-gray-700"
        >
          ← Back
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Membership Plan</h1>
          <p className="text-gray-500 mt-1">Update plan details, pricing, and features</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Premium Membership"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="STANDARD">Standard</option>
                <option value="PREMIUM">Premium</option>
                <option value="VIP">VIP</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe what this plan includes"
            />
          </div>
        </div>

        {/* Pricing Options */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Pricing Options</h2>
            <button type="button" onClick={addPrice} className="text-sm text-blue-600 hover:text-blue-800">
              + Add Billing Frequency
            </button>
          </div>
          {formData.prices.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No pricing options added yet</p>
          ) : (
            <div className="space-y-4">
              {formData.prices.map((price, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-gray-700">Option {index + 1}</span>
                    {formData.prices.length > 1 && (
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
                  {price.id && (
                    <input type="hidden" name={`prices[${index}].id`} value={price.id} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Features */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Features Included</h2>
            <button type="button" onClick={addFeature} className="text-sm text-blue-600 hover:text-blue-800">
              + Add Feature
            </button>
          </div>
          {formData.features.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No features added yet</p>
          ) : (
            <div className="space-y-3">
              {formData.features.map((feature, index) => (
                <div key={index} className="flex gap-3">
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
          )}
        </div>

        {/* Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings</h2>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Public Plan (visible to all)</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.requiresApproval}
                onChange={(e) => setFormData({ ...formData, requiresApproval: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Requires Approval for New Members</span>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  )
}