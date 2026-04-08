"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Toast, useToast } from "@/components/ui/toast"

interface House {
  name: string
  slug: string
  description: string
}

export default function CreateOrganizationPage() {
  const router = useRouter()
  const { toast, showToast, hideToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    ownerEmail: "",
    plan: "FREE",
  })
  
  const [houses, setHouses] = useState<House[]>([
    { name: "", slug: "", description: "" }
  ])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Auto-generate slug from name
    if (name === "name") {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
      setFormData(prev => ({ ...prev, slug }))
    }
  }

  const handleHouseChange = (index: number, field: keyof House, value: string) => {
    const updatedHouses = [...houses]
    updatedHouses[index][field] = value
    
    // Auto-generate house slug from name
    if (field === "name") {
      updatedHouses[index].slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    }
    
    setHouses(updatedHouses)
  }

  const addHouse = () => {
    setHouses([...houses, { name: "", slug: "", description: "" }])
  }

  const removeHouse = (index: number) => {
    if (houses.length === 1) {
      showToast("Organization must have at least one house", "error")
      return
    }
    const updatedHouses = houses.filter((_, i) => i !== index)
    setHouses(updatedHouses)
  }

  const validateHouses = () => {
    for (const house of houses) {
      if (!house.name.trim()) {
        showToast("All houses must have a name", "error")
        return false
      }
      if (!house.slug.trim()) {
        showToast("All houses must have a slug", "error")
        return false
      }
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateHouses()) {
      return
    }
    
    if (!formData.ownerEmail) {
      showToast("Owner email is required", "error")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/platform/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          houses: houses.filter(h => h.name.trim() && h.slug.trim())
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create organization")
      }

      showToast(`Organization "${formData.name}" created with ${houses.length} house(s)! Invitation sent to ${formData.ownerEmail}`, "success")
      
      setTimeout(() => {
        router.push("/platform/organizations?created=true")
      }, 1500)
    } catch (error: any) {
      showToast(error.message, "error")
      setLoading(false)
    }
  }

  return (
    <div>
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      <div className="mb-8">
        <Link href="/platform/organizations" className="text-blue-600 hover:text-blue-900 text-sm mb-2 inline-block">
          ← Back to Organizations
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create New Organization</h1>
        <p className="text-gray-500">Create an organization with at least one house and invite the owner</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 max-w-3xl">
        <div className="space-y-6">
          {/* Organization Details */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Organization Details</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Organization Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Acme Inc"
                />
              </div>

              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                  Organization Slug (URL) *
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    membershome.com/org/
                  </span>
                  <input
                    type="text"
                    id="slug"
                    name="slug"
                    required
                    value={formData.slug}
                    onChange={handleChange}
                    className="flex-1 block w-full px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="acme"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Only lowercase letters, numbers, and hyphens</p>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Organization Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief description of the organization"
                />
              </div>

              <div>
                <label htmlFor="ownerEmail" className="block text-sm font-medium text-gray-700">
                  Owner Email *
                </label>
                <input
                  type="email"
                  id="ownerEmail"
                  name="ownerEmail"
                  required
                  value={formData.ownerEmail}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="owner@example.com"
                />
                <p className="mt-1 text-xs text-gray-500">
                  This user will be invited as the organization owner. They will receive an email to set up their account.
                </p>
              </div>

              <div>
                <label htmlFor="plan" className="block text-sm font-medium text-gray-700">
                  Plan
                </label>
                <select
                  id="plan"
                  name="plan"
                  value={formData.plan}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="FREE">Free</option>
                  <option value="STARTER">Starter ($49/month)</option>
                  <option value="PROFESSIONAL">Professional ($99/month)</option>
                  <option value="ENTERPRISE">Enterprise (Custom)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Houses Section */}
          <div className="border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Houses / Chapters *</h2>
              <button
                type="button"
                onClick={addHouse}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                + Add House
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">At least one house is required. Houses represent chapters, teams, or locations within your organization.</p>
            
            <div className="space-y-4">
              {houses.map((house, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-md font-medium text-gray-700">House {index + 1}</h3>
                    {houses.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeHouse(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        House Name *
                      </label>
                      <input
                        type="text"
                        value={house.name}
                        onChange={(e) => handleHouseChange(index, "name", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Kenya Chapter"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        House Slug *
                      </label>
                      <input
                        type="text"
                        value={house.slug}
                        onChange={(e) => handleHouseChange(index, "slug", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="kenya-chapter"
                        required
                      />
                      <p className="mt-1 text-xs text-gray-500">Only lowercase letters, numbers, and hyphens</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        House Description (Optional)
                      </label>
                      <textarea
                        value={house.description}
                        onChange={(e) => handleHouseChange(index, "description", e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Brief description of this house/chapter"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Link
              href="/platform/organizations"
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create Organization"}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}