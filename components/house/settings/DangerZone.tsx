// components/house/settings/DangerZone.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { AlertTriangle, Trash2, Archive, X } from 'lucide-react'

interface DangerZoneProps {
  orgSlug: string
  houseSlug: string
  houseId: string
  houseName: string
}

export default function DangerZone({ orgSlug, houseSlug, houseId, houseName }: DangerZoneProps) {
  const router = useRouter()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showArchiveModal, setShowArchiveModal] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleArchive = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/org/${orgSlug}/houses/${houseSlug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ARCHIVED' }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Failed to archive house')
        return
      }

      toast.success('House archived successfully')
      router.push(`/org/${orgSlug}/dashboard`)
      router.refresh()
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
      setShowArchiveModal(false)
    }
  }

  const handleDelete = async () => {
    if (confirmation !== houseName) {
      toast.error('Please type the house name correctly')
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/org/${orgSlug}/houses/${houseSlug}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Failed to delete house')
        return
      }

      toast.success('House deleted successfully')
      router.push(`/org/${orgSlug}/dashboard`)
      router.refresh()
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
      setShowDeleteModal(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Archive House */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium text-gray-900">Archive this house</h3>
          <p className="text-sm text-gray-600 mt-1">
            Archiving will hide the house from all views but preserve all data.
            You can restore it later.
          </p>
        </div>
        <button
          onClick={() => setShowArchiveModal(true)}
          className="px-4 py-2 text-sm font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition"
        >
          <Archive className="inline h-4 w-4 mr-2" />
          Archive House
        </button>
      </div>

      {/* Delete House */}
      <div className="pt-6 border-t border-gray-200">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-medium text-red-900">Delete this house</h3>
            <p className="text-sm text-red-700 mt-1">
              Once you delete a house, there is no going back. Please be certain.
            </p>
            <p className="text-sm text-red-700 mt-2">
              This will permanently delete:
            </p>
            <ul className="list-disc list-inside text-sm text-red-700 mt-1 space-y-1">
              <li>All house settings and configurations</li>
              <li>All member data and profiles</li>
              <li>All events, tickets, and RSVPs</li>
              <li>All membership plans and applications</li>
              <li>All communications and forms</li>
            </ul>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-red-700 rounded-lg hover:bg-red-700 transition"
          >
            <Trash2 className="inline h-4 w-4 mr-2" />
            Delete House
          </button>
        </div>
      </div>

      {/* Archive Confirmation Modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/30" onClick={() => setShowArchiveModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-100 rounded-full">
                <Archive className="h-5 w-5 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Archive House</h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to archive <strong>{houseName}</strong>?
            </p>
            
            <div className="bg-orange-50 rounded-lg p-3 border border-orange-200 mb-4">
              <p className="text-sm text-orange-800">
                <AlertTriangle className="inline h-4 w-4 mr-1" />
                The house will be hidden from all members and public views.
                You can restore it later from the organization settings.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowArchiveModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleArchive}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                {isLoading ? 'Archiving...' : 'Archive House'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/30" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete House</h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              This action <strong>cannot be undone</strong>. This will permanently delete the house
              and all associated data.
            </p>
            
            <div className="bg-red-50 rounded-lg p-3 border border-red-200 mb-4">
              <p className="text-sm text-red-800">
                <AlertTriangle className="inline h-4 w-4 mr-1" />
                Please type <strong>{houseName}</strong> to confirm.
              </p>
            </div>

            <div className="mb-4">
              <input
                type="text"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                placeholder={houseName}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setConfirmation('')
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isLoading || confirmation !== houseName}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}