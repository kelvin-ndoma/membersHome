// components/plans/PlanActions.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  Copy, 
  Eye,
  EyeOff,
  Archive,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface PlanActionsProps {
  plan: any
}

export default function PlanActions({ plan }: PlanActionsProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleStatusChange = async (newStatus: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/org/${plan.organization.slug}/houses/${plan.house?.slug}/plans/${plan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error('Failed to update plan')
      
      toast.success(`Plan ${newStatus.toLowerCase()}`)
      router.refresh()
      setIsOpen(false)
    } catch (error) {
      toast.error('Failed to update plan status')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (plan._count?.memberships > 0) {
      toast.error('Cannot delete plan with active members')
      setShowDeleteConfirm(false)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/org/${plan.organization.slug}/houses/${plan.house?.slug}/plans/${plan.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete plan')
      
      toast.success('Plan deleted')
      router.push(`/org/${plan.organization.slug}/houses/${plan.house?.slug}/plans`)
      router.refresh()
    } catch (error) {
      toast.error('Failed to delete plan')
    } finally {
      setIsLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleDuplicate = () => {
    router.push(`/org/${plan.organization.slug}/houses/${plan.house?.slug}/plans/create?duplicate=${plan.id}`)
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
                router.push(`/org/${plan.organization.slug}/houses/${plan.house?.slug}/plans/${plan.id}/edit`)
                setIsOpen(false)
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Edit className="h-4 w-4" />
              Edit Plan
            </button>
            
            <button
              onClick={handleDuplicate}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Copy className="h-4 w-4" />
              Duplicate
            </button>

            <div className="border-t border-gray-100 my-1" />

            {plan.status === 'ACTIVE' ? (
              <button
                onClick={() => handleStatusChange('INACTIVE')}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-yellow-700 hover:bg-yellow-50"
              >
                <EyeOff className="h-4 w-4" />
                Deactivate
              </button>
            ) : plan.status === 'INACTIVE' ? (
              <button
                onClick={() => handleStatusChange('ACTIVE')}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-green-700 hover:bg-green-50"
              >
                <Eye className="h-4 w-4" />
                Activate
              </button>
            ) : null}

            {plan.status !== 'ARCHIVED' && plan._count?.memberships === 0 && (
              <button
                onClick={() => handleStatusChange('ARCHIVED')}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Archive className="h-4 w-4" />
                Archive
              </button>
            )}

            {plan._count?.memberships === 0 && (
              <>
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
              </>
            )}
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/30" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Plan</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete "{plan.name}"? This action cannot be undone.
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