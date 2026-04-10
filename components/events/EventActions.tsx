// components/events/EventActions.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  Copy, 
  Share2,
  Eye,
  EyeOff,
  QrCode,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface EventActionsProps {
  event: any
}

export default function EventActions({ event }: EventActionsProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleStatusChange = async (newStatus: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/org/${event.organization.slug}/houses/${event.house?.slug}/events/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error('Failed to update event')
      
      toast.success(`Event ${newStatus.toLowerCase()}`)
      router.refresh()
      setIsOpen(false)
    } catch (error) {
      toast.error('Failed to update event status')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/org/${event.organization.slug}/houses/${event.house?.slug}/events/${event.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to delete event')
      }
      
      toast.success('Event deleted')
      router.push(`/org/${event.organization.slug}/houses/${event.house?.slug}/events`)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete event')
    } finally {
      setIsLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleDuplicate = () => {
    router.push(`/org/${event.organization.slug}/houses/${event.house?.slug}/events/create?duplicate=${event.id}`)
    setIsOpen(false)
  }

  const handleShare = () => {
    const url = `${window.location.origin}/events/${event.slug}`
    navigator.clipboard?.writeText(url)
    toast.success('Event link copied to clipboard!')
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
            <button
              onClick={() => {
                router.push(`/org/${event.organization.slug}/houses/${event.house?.slug}/events/${event.id}/edit`)
                setIsOpen(false)
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Edit className="h-4 w-4" />
              Edit Event
            </button>
            
            <button
              onClick={handleDuplicate}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Copy className="h-4 w-4" />
              Duplicate
            </button>
            
            <button
              onClick={handleShare}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Share2 className="h-4 w-4" />
              Share Link
            </button>

            <div className="border-t border-gray-100 my-1" />

            {event.status === 'PUBLISHED' ? (
              <button
                onClick={() => handleStatusChange('DRAFT')}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-yellow-700 hover:bg-yellow-50"
              >
                <EyeOff className="h-4 w-4" />
                Unpublish
              </button>
            ) : event.status === 'DRAFT' ? (
              <button
                onClick={() => handleStatusChange('PUBLISHED')}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-green-700 hover:bg-green-50"
              >
                <Eye className="h-4 w-4" />
                Publish
              </button>
            ) : null}

            {event.status !== 'CANCELLED' && (
              <button
                onClick={() => handleStatusChange('CANCELLED')}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Cancel Event
              </button>
            )}

            <div className="border-t border-gray-100 my-1" />
            
            <button
              onClick={() => {
                setIsOpen(false)
                setShowDeleteConfirm(true)
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete Permanently
            </button>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/30" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Event</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to permanently delete "{event.title}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}