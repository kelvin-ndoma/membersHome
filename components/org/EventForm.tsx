"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ImageUpload from '@/components/ui/ImageUpload'
import { Toast, useToast } from '@/components/ui/toast'

interface EventFormProps {
  orgSlug: string
  houseSlug: string
  initialData?: any
  isEditing?: boolean
}

export default function EventForm({ orgSlug, houseSlug, initialData, isEditing }: EventFormProps) {
  const router = useRouter()
  const { toast, showToast, hideToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '')
  const [imagePublicId, setImagePublicId] = useState(initialData?.imagePublicId || '')
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    description: initialData?.description || '',
    startDate: initialData?.startDate ? new Date(initialData.startDate).toISOString().slice(0, 16) : '',
    endDate: initialData?.endDate ? new Date(initialData.endDate).toISOString().slice(0, 16) : '',
    location: initialData?.location || '',
    onlineUrl: initialData?.onlineUrl || '',
    type: initialData?.type || 'IN_PERSON',
    isFree: initialData?.isFree ?? true,
    price: initialData?.price || 0,
    capacity: initialData?.capacity || '',
    memberOnly: initialData?.memberOnly ?? false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!imageUrl) {
      showToast('Please upload an event image', 'error')
      setLoading(false)
      return
    }

    try {
      const url = isEditing 
        ? `/api/org/${orgSlug}/houses/${houseSlug}/events/${initialData.id}`
        : `/api/org/${orgSlug}/houses/${houseSlug}/events`
      
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          imageUrl,
          imagePublicId,
          price: formData.isFree ? 0 : formData.price,
          capacity: formData.capacity ? parseInt(formData.capacity) : null,
        }),
      })

      if (response.ok) {
        showToast(isEditing ? 'Event updated successfully!' : 'Event created successfully!', 'success')
        setTimeout(() => {
          router.push(`/org/${orgSlug}/houses/${houseSlug}/events`)
          router.refresh()
        }, 1500)
      } else {
        const error = await response.json()
        showToast(error.error || 'Failed to save event', 'error')
      }
    } catch (error) {
      showToast('Failed to save event', 'error')
    } finally {
      setLoading(false)
    }
  }

  const autoGenerateSlug = (title: string) => {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    setFormData({ ...formData, title, slug })
  }

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Upload */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Event Image</h2>
          <ImageUpload
            onUpload={(url, publicId) => {
              setImageUrl(url)
              setImagePublicId(publicId)
            }}
            existingImage={imageUrl}
            folder={`events/${orgSlug}/${houseSlug}`}
          />
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => autoGenerateSlug(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Annual Conference 2024"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL) *</label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="annual-conference-2024"
              />
              <p className="mt-1 text-xs text-gray-500">Only lowercase letters, numbers, and hyphens</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe your event..."
              />
            </div>
          </div>
        </div>

        {/* Date & Time */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Date & Time</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time *</label>
              <input
                type="datetime-local"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time *</label>
              <input
                type="datetime-local"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="IN_PERSON">In Person</option>
                <option value="ONLINE">Online</option>
                <option value="HYBRID">Hybrid</option>
              </select>
            </div>
            {(formData.type === 'IN_PERSON' || formData.type === 'HYBRID') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Venue/Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Convention Center, City"
                />
              </div>
            )}
            {(formData.type === 'ONLINE' || formData.type === 'HYBRID') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Online URL</label>
                <input
                  type="url"
                  value={formData.onlineUrl}
                  onChange={(e) => setFormData({ ...formData, onlineUrl: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://zoom.us/..."
                />
              </div>
            )}
          </div>
        </div>

        {/* Tickets & Pricing */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tickets & Pricing</h2>
          <div className="space-y-4">
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.memberOnly}
                  onChange={(e) => setFormData({ ...formData, memberOnly: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Members Only Event</span>
              </label>
              <p className="mt-1 text-xs text-gray-500">Only organization members can RSVP</p>
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isFree}
                  onChange={(e) => setFormData({ ...formData, isFree: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Free Event</span>
              </label>
            </div>
            {!formData.isFree && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="49.99"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (Optional)</label>
              <input
                type="number"
                min="1"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Leave empty for unlimited"
              />
            </div>
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
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (isEditing ? 'Saving...' : 'Creating...') : (isEditing ? 'Save Changes' : 'Create Event')}
          </button>
        </div>
      </form>
    </div>
  )
}