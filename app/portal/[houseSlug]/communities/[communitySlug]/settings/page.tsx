// app/portal/[houseSlug]/communities/[communitySlug]/settings/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Save,
  Globe,
  Lock,
  Users,
  Image as ImageIcon,
  AlertTriangle,
  Trash2,
  Check,
  X,
  Upload
} from 'lucide-react'

interface CommunitySettings {
  name: string
  slug: string
  description: string
  isPrivate: boolean
  requiresApproval: boolean
  maxMembers: number | null
  coverImage: string | null
  logoUrl: string | null
  useCustomBranding: boolean
  primaryColor: string
  secondaryColor: string
  accentColor: string
}

export default function CommunitySettingsPage() {
  const params = useParams()
  const router = useRouter()
  const houseSlug = params.houseSlug as string
  const communitySlug = params.communitySlug as string
  
  const [settings, setSettings] = useState<CommunitySettings>({
    name: '',
    slug: '',
    description: '',
    isPrivate: false,
    requiresApproval: true,
    maxMembers: null,
    coverImage: null,
    logoUrl: null,
    useCustomBranding: false,
    primaryColor: '#8B5CF6',
    secondaryColor: '#EC4899',
    accentColor: '#10B981'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [communitySlug])

  const fetchSettings = async () => {
    try {
      const response = await fetch(`/api/portal/${houseSlug}/communities/${communitySlug}`)
      const data = await response.json()
      
      if (data.success) {
        setSettings({
          name: data.community.name,
          slug: data.community.slug,
          description: data.community.description || '',
          isPrivate: data.community.isPrivate,
          requiresApproval: data.community.requiresApproval,
          maxMembers: data.community.maxMembers,
          coverImage: data.community.coverImage,
          logoUrl: data.community.logoUrl,
          useCustomBranding: data.community.useCustomBranding || false,
          primaryColor: data.community.primaryColor || '#8B5CF6',
          secondaryColor: data.community.secondaryColor || '#EC4899',
          accentColor: data.community.accentColor || '#10B981'
        })
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkSlugAvailability = async (slug: string) => {
    if (!slug || slug === settings.slug) {
      setSlugAvailable(null)
      return
    }
    
    try {
      const response = await fetch(`/api/portal/${houseSlug}/communities/check-slug?slug=${slug}&excludeId=${communitySlug}`)
      const data = await response.json()
      setSlugAvailable(data.available)
    } catch (error) {
      console.error('Failed to check slug:', error)
    }
  }

  const handleSlugChange = (slug: string) => {
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setSettings({ ...settings, slug: cleanSlug })
    checkSlugAvailability(cleanSlug)
  }

  const handleImageUpload = async (file: File, type: 'cover' | 'logo') => {
    if (type === 'cover') setUploadingCover(true)
    else setUploadingLogo(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      if (data.url) {
        setSettings({
          ...settings,
          [type === 'cover' ? 'coverImage' : 'logoUrl']: data.url
        })
      }
    } catch (error) {
      console.error('Failed to upload image:', error)
      alert('Failed to upload image')
    } finally {
      if (type === 'cover') setUploadingCover(false)
      else setUploadingLogo(false)
    }
  }

  const handleSave = async () => {
    if (!settings.name.trim()) {
      alert('Community name is required')
      return
    }
    
    if (!settings.slug) {
      alert('Community URL is required')
      return
    }
    
    if (slugAvailable === false) {
      alert('This URL is already taken')
      return
    }
    
    setSaving(true)
    try {
      const response = await fetch(`/api/portal/${houseSlug}/communities/${communitySlug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      
      const data = await response.json()
      if (data.success) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      } else {
        alert(data.error || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      alert('An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCommunity = async () => {
    if (deleteConfirmText !== settings.name) {
      alert('Community name does not match')
      return
    }
    
    try {
      const response = await fetch(`/api/portal/${houseSlug}/communities/${communitySlug}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      if (data.success) {
        router.push(`/portal/${houseSlug}/communities`)
      } else {
        alert(data.error || 'Failed to delete community')
      }
    } catch (error) {
      console.error('Failed to delete community:', error)
      alert('An error occurred')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Community Settings</h1>
        <p className="text-gray-600 mt-1">Manage your community's appearance and preferences</p>
      </div>
      
      {/* Success Message */}
      {saveSuccess && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <Check className="h-5 w-5 text-green-600" />
          <p className="text-green-700">Settings saved successfully!</p>
        </div>
      )}
      
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Community Name *
              </label>
              <input
                type="text"
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Community URL *
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  /portal/{houseSlug}/communities/
                </span>
                <input
                  type="text"
                  value={settings.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${
                    slugAvailable === false ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {slugAvailable === false && (
                <p className="text-red-500 text-xs mt-1">This URL is already taken</p>
              )}
              {slugAvailable === true && settings.slug !== '' && (
                <p className="text-green-500 text-xs mt-1">URL is available</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={settings.description}
                onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                rows={4}
                placeholder="Describe what your community is about..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                {settings.description.length}/500 characters
              </p>
            </div>
          </div>
        </div>
        
        {/* Images */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Images</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cover Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cover Image
              </label>
              <div className="relative h-32 bg-gray-100 rounded-lg overflow-hidden">
                {settings.coverImage ? (
                  <>
                    <img src={settings.coverImage} alt="Cover" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setSettings({ ...settings, coverImage: null })}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <label className="flex flex-col items-center justify-center h-full cursor-pointer hover:bg-gray-50 transition">
                    <Upload className="h-8 w-8 text-gray-400" />
                    <span className="text-sm text-gray-500 mt-1">Upload cover image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleImageUpload(e.target.files[0], 'cover')
                        }
                      }}
                    />
                  </label>
                )}
              </div>
              {uploadingCover && (
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                  Uploading...
                </div>
              )}
            </div>
            
            {/* Logo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Community Logo
              </label>
              <div className="relative w-24 h-24 bg-gray-100 rounded-xl overflow-hidden">
                {settings.logoUrl ? (
                  <>
                    <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setSettings({ ...settings, logoUrl: null })}
                      className="absolute top-1 right-1 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </>
                ) : (
                  <label className="flex flex-col items-center justify-center h-full cursor-pointer hover:bg-gray-50 transition">
                    <Upload className="h-6 w-6 text-gray-400" />
                    <span className="text-xs text-gray-500 mt-1">Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleImageUpload(e.target.files[0], 'logo')
                        }
                      }}
                    />
                  </label>
                )}
              </div>
              {uploadingLogo && (
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                  Uploading...
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Privacy & Access */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Privacy & Access</h2>
          
          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                checked={!settings.isPrivate}
                onChange={() => setSettings({ ...settings, isPrivate: false })}
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
                checked={settings.isPrivate}
                onChange={() => setSettings({ ...settings, isPrivate: true })}
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
            
            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.requiresApproval}
                  onChange={(e) => setSettings({ ...settings, requiresApproval: e.target.checked })}
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
                value={settings.maxMembers || ''}
                onChange={(e) => setSettings({ ...settings, maxMembers: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="Leave empty for unlimited"
                className="w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>
        
        {/* Branding */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Custom Branding</h2>
          
          <div className="mb-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.useCustomBranding}
                onChange={(e) => setSettings({ ...settings, useCustomBranding: e.target.checked })}
                className="rounded"
              />
              <div>
                <span className="font-medium text-gray-900">Use custom colors</span>
                <p className="text-sm text-gray-500">
                  Override the default house branding for this community
                </p>
              </div>
            </label>
          </div>
          
          {settings.useCustomBranding && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Primary Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                    className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.primaryColor}
                    onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Secondary Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.secondaryColor}
                    onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                    className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.secondaryColor}
                    onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Accent Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.accentColor}
                    onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                    className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.accentColor}
                    onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Danger Zone */}
        <div className="bg-red-50 rounded-xl border border-red-200 p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-4">Danger Zone</h2>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-red-800">Delete Community</p>
              <p className="text-sm text-red-600">
                Once deleted, this community cannot be recovered. All posts and data will be permanently removed.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              <Trash2 className="h-4 w-4" />
              Delete Community
            </button>
          </div>
        </div>
        
        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowDeleteModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-xl z-50 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Community</h3>
            </div>
            
            <p className="text-gray-600 mb-4">
              This action cannot be undone. All posts, comments, and member data will be permanently deleted.
            </p>
            
            <p className="text-sm font-medium text-gray-700 mb-2">
              Type <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">{settings.name}</span> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
              placeholder="Enter community name"
            />
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCommunity}
                disabled={deleteConfirmText !== settings.name}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                Delete Forever
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}