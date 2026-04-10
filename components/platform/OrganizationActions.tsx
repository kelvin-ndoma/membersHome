// components/platform/OrganizationActions.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreVertical, Pause, Play, Archive, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

interface OrganizationActionsProps {
  orgId: string
  orgName: string
  currentStatus: string
  variant?: 'default' | 'danger'
}

export default function OrganizationActions({ 
  orgId, 
  orgName, 
  currentStatus,
  variant = 'default' 
}: OrganizationActionsProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [actionType, setActionType] = useState<'suspend' | 'reactivate' | 'cancel' | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [reason, setReason] = useState('')

  const handleAction = async () => {
    if (!actionType) return

    setIsLoading(true)
    
    try {
      let endpoint = ''
      let method = 'POST'
      let body: any = { reason }

      switch (actionType) {
        case 'suspend':
          endpoint = `/api/platform/organizations/${orgId}/suspend`
          body.permanent = false
          break
        case 'reactivate':
          endpoint = `/api/platform/organizations/${orgId}/suspend`
          body.permanent = false
          body.unsuspend = true
          break
        case 'cancel':
          endpoint = `/api/platform/organizations/${orgId}`
          method = 'DELETE'
          break
      }

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Action failed')
        return
      }

      const messages = {
        suspend: 'Organization suspended successfully',
        reactivate: 'Organization reactivated successfully',
        cancel: 'Organization cancelled successfully'
      }

      toast.success(messages[actionType])
      setShowConfirmModal(false)
      setIsOpen(false)
      router.refresh()
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const openConfirmModal = (type: 'suspend' | 'reactivate' | 'cancel') => {
    setActionType(type)
    setShowConfirmModal(true)
    setIsOpen(false)
  }

  const isSuspended = currentStatus === 'SUSPENDED'
  const isCancelled = currentStatus === 'CANCELLED'

  if (variant === 'danger') {
    return (
      <>
        <div className="space-y-2">
          {!isSuspended && !isCancelled && (
            <button
              onClick={() => openConfirmModal('suspend')}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition"
            >
              <Pause className="h-4 w-4" />
              Suspend Organization
            </button>
          )}
          
          {isSuspended && (
            <button
              onClick={() => openConfirmModal('reactivate')}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition"
            >
              <Play className="h-4 w-4" />
              Reactivate Organization
            </button>
          )}
          
          {!isCancelled && (
            <button
              onClick={() => openConfirmModal('cancel')}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition"
            >
              <Archive className="h-4 w-4" />
              Cancel Organization
            </button>
          )}
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <div className="fixed inset-0 bg-black/30" onClick={() => setShowConfirmModal(false)} />
              
              <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-full ${
                    actionType === 'suspend' ? 'bg-yellow-100' :
                    actionType === 'cancel' ? 'bg-red-100' : 'bg-green-100'
                  }`}>
                    <AlertTriangle className={`h-5 w-5 ${
                      actionType === 'suspend' ? 'text-yellow-600' :
                      actionType === 'cancel' ? 'text-red-600' : 'text-green-600'
                    }`} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {actionType === 'suspend' && 'Suspend Organization'}
                    {actionType === 'reactivate' && 'Reactivate Organization'}
                    {actionType === 'cancel' && 'Cancel Organization'}
                  </h3>
                </div>

                <p className="text-sm text-gray-600 mb-4">
                  {actionType === 'suspend' && `Are you sure you want to suspend ${orgName}? Members will not be able to access their portals while suspended.`}
                  {actionType === 'reactivate' && `Are you sure you want to reactivate ${orgName}? Members will regain access to their portals.`}
                  {actionType === 'cancel' && `Are you sure you want to cancel ${orgName}? This action cannot be undone.`}
                </p>

                {(actionType === 'suspend' || actionType === 'cancel') && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Reason (Optional)
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={3}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter reason for this action..."
                    />
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAction}
                    disabled={isLoading}
                    className={`px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 ${
                      actionType === 'suspend' ? 'bg-yellow-600 hover:bg-yellow-700' :
                      actionType === 'reactivate' ? 'bg-green-600 hover:bg-green-700' :
                      'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {isLoading ? 'Processing...' : 'Confirm'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  // Default dropdown variant
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
      >
        Actions
        <MoreVertical className="h-4 w-4" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
            {!isSuspended && !isCancelled && (
              <button
                onClick={() => openConfirmModal('suspend')}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-yellow-700 hover:bg-yellow-50"
              >
                <Pause className="h-4 w-4" />
                Suspend Organization
              </button>
            )}
            
            {isSuspended && (
              <button
                onClick={() => openConfirmModal('reactivate')}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-green-700 hover:bg-green-50"
              >
                <Play className="h-4 w-4" />
                Reactivate Organization
              </button>
            )}
            
            {!isCancelled && (
              <button
                onClick={() => openConfirmModal('cancel')}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-orange-700 hover:bg-orange-50"
              >
                <Archive className="h-4 w-4" />
                Cancel Organization
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}