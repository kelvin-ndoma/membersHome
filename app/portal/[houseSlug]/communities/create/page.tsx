// app/portal/[houseSlug]/communities/create/page.tsx
'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Lock, 
  Globe, 
  Users, 
  AlertCircle,
  Check,
  Upload
} from 'lucide-react'

export default function CreateCommunityPage() {
  const params = useParams()
  const router = useRouter()
  const houseSlug = params.houseSlug as string

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    isPrivate: false,
    requiresApproval: true,
    maxMembers: '',
    coverImage: '',
    logoUrl: ''
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [checkingSlug, setCheckingSlug] = useState(false)

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    if (field === 'name') {
      const generatedSlug = value.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      setFormData(prev => ({ ...prev, slug: generatedSlug }))
      checkSlugAvailability(generatedSlug)
    }
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const checkSlugAvailability = async (slug: string) => {
    if (!slug) return
    
    setCheckingSlug(true)
    try {
      const response = await fetch(`/api/portal/${houseSlug}/communities/check-slug?slug=${slug}`)
      const data = await response.json()
      setSlugAvailable(data.available)
    } catch (error) {
      console.error('Failed to check slug:', error)
    } finally {
      setCheckingSlug(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Community name is required'
    } else if (formData.name.length < 3) {
      newErrors.name = 'Name must be at least 3 characters'
    }
    
    if (!formData.slug) {
      newErrors.slug = 'Slug is required'
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Only lowercase letters, numbers, and hyphens allowed'
    }
    
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters'
    }
    
    if (formData.maxMembers && parseInt(formData.maxMembers) < 1) {
      newErrors.maxMembers = 'Maximum members must be at least 1'
    }
    
    if (slugAvailable === false) {
      newErrors.slug = 'This URL slug is already taken'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/portal/${houseSlug}/communities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        router.push(`/portal/${houseSlug}/communities/${data.community.slug}`)
      } else {
        setErrors({ submit: data.error || 'Failed to create community' })
      }
    } catch (error) {
      setErrors({ submit: 'An unexpected error occurred' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900">Create a Community</h1>
          <p className="text-gray-600 mt-1">
            Build a space for members to connect and share interests
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Community Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., Tech Enthusiasts, Book Club, Fitness Group"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Community URL *
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  /portal/{houseSlug}/communities/
                </span>
                <div className="flex-1">
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => {
                      const slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                      handleChange('slug', slug)
                      checkSlugAvailability(slug)
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 ${
                      errors.slug ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
              </div>
              {checkingSlug && (
                <p className="text-gray-500 text-xs mt-1">Checking availability...</p>
              )}
              {slugAvailable === true && !errors.slug && (
                <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                  <Check className="h-3 w-3" /> Available
                </p>
              )}
              {slugAvailable === false && (
                <p className="text-red-500 text-xs mt-1">This URL is already taken</p>
              )}
              {errors.slug && (
                <p className="text-red-500 text-xs mt-1">{errors.slug}</p>
              )}
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={4}
                placeholder="Describe what your community is about..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.description.length}/500 characters
              </p>
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">{errors.description}</p>
              )}
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Privacy & Access</h2>
            
            <div className="mb-4 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  checked={!formData.isPrivate}
                  onChange={() => handleChange('isPrivate', false)}
                  className="mt-1"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-900">Public Community</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Anyone can see the community and its content
                  </p>
                </div>
              </label>
              
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  checked={formData.isPrivate}
                  onChange={() => handleChange('isPrivate', true)}
                  className="mt-1"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-900">Private Community</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Only members can see the community and its content
                  </p>
                </div>
              </label>
            </div>
            
            <div className="mb-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requiresApproval}
                  onChange={(e) => handleChange('requiresApproval', e.target.checked)}
                  className="rounded"
                />
                <div>
                  <span className="font-medium text-gray-900">Require approval for new members</span>
                  <p className="text-sm text-gray-500">
                    Review and approve join requests before members can join
                  </p>
                </div>
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Members (Optional)
              </label>
              <input
                type="number"
                value={formData.maxMembers}
                onChange={(e) => handleChange('maxMembers', e.target.value)}
                placeholder="Leave empty for unlimited"
                className="w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
              />
              {errors.maxMembers && (
                <p className="text-red-500 text-xs mt-1">{errors.maxMembers}</p>
              )}
            </div>
          </div>

          {/* Submit */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Community'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}