// components/house/settings/PrivacySettings.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Lock, Globe, Eye, EyeOff } from 'lucide-react'

interface PrivacySettingsProps {
  house: {
    id: string
    isPrivate: boolean
  }
}

export default function PrivacySettings({ house }: PrivacySettingsProps) {
  const router = useRouter()
  const [isPrivate, setIsPrivate] = useState(house.isPrivate)
  const [isLoading, setIsLoading] = useState(false)

  const handleTogglePrivacy = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/houses/${house.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPrivate: !isPrivate }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Failed to update privacy settings')
        return
      }

      setIsPrivate(!isPrivate)
      toast.success(`House is now ${!isPrivate ? 'private' : 'public'}`)
      router.refresh()
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Privacy Toggle */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {isPrivate ? (
              <Lock className="h-5 w-5 text-orange-600" />
            ) : (
              <Globe className="h-5 w-5 text-green-600" />
            )}
            <h3 className="font-medium text-gray-900">
              {isPrivate ? 'Private House' : 'Public House'}
            </h3>
          </div>
          <p className="text-sm text-gray-600">
            {isPrivate 
              ? 'Only invited members can find and join this house. It will not appear in public listings.'
              : 'Anyone can discover this house and apply for membership.'
            }
          </p>
        </div>
        
        <button
          onClick={handleTogglePrivacy}
          disabled={isLoading}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            isPrivate ? 'bg-orange-600' : 'bg-green-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isPrivate ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Visibility Note */}
      <div className={`p-4 rounded-lg ${isPrivate ? 'bg-orange-50 border border-orange-200' : 'bg-green-50 border border-green-200'}`}>
        <div className="flex items-start gap-3">
          {isPrivate ? (
            <EyeOff className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
          ) : (
            <Eye className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p className={`text-sm font-medium ${isPrivate ? 'text-orange-800' : 'text-green-800'}`}>
              {isPrivate ? 'This house is hidden from public view' : 'This house is visible to the public'}
            </p>
            <p className={`text-xs mt-1 ${isPrivate ? 'text-orange-700' : 'text-green-700'}`}>
              {isPrivate 
                ? 'Only members with direct invitation links can access this house.'
                : 'Your house appears in the discover page and search results.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}