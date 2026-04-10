// components/tickets/TicketActions.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  Copy, 
  Download,
  Pause,
  Play,
  Archive,
  Eye,
  EyeOff,
  Send,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface TicketActionsProps {
  ticket: any
}

export default function TicketActions({ ticket }: TicketActionsProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleStatusChange = async (newStatus: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/org/${ticket.organization.slug}/houses/${ticket.house?.slug}/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error('Failed to update ticket')
      
      const messages: Record<string, string> = {
        ACTIVE: 'Ticket published successfully',
        DRAFT: 'Ticket moved to drafts',
        PAUSED: 'Ticket sales paused',
        CANCELLED: 'Ticket cancelled',
      }
      
      toast.success(messages[newStatus] || `Ticket ${newStatus.toLowerCase()}`)
      router.refresh()
      setIsOpen(false)
    } catch (error) {
      toast.error('Failed to update ticket status')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (ticket.soldQuantity > 0) {
      toast.error('Cannot delete ticket with sales')
      setShowDeleteConfirm(false)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/org/${ticket.organization.slug}/houses/${ticket.house?.slug}/tickets/${ticket.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete ticket')
      
      toast.success('Ticket deleted')
      router.push(`/org/${ticket.organization.slug}/houses/${ticket.house?.slug}/tickets${ticket.event ? `?eventId=${ticket.event.id}` : ''}`)
      router.refresh()
    } catch (error) {
      toast.error('Failed to delete ticket')
    } finally {
      setIsLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleDuplicate = () => {
    router.push(`/org/${ticket.organization.slug}/houses/${ticket.house?.slug}/tickets/create?eventId=${ticket.event?.id}&duplicate=${ticket.id}`)
    setIsOpen(false)
  }

  const handleExport = () => {
    // Export ticket data as CSV
    const data = {
      name: ticket.name,
      type: ticket.type,
      price: ticket.price,
      currency: ticket.currency,
      soldQuantity: ticket.soldQuantity,
      totalQuantity: ticket.totalQuantity,
      status: ticket.status,
    }
    
    const csv = Object.entries(data).map(([key, value]) => `${key},${value}`).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ticket-${ticket.id}.csv`
    a.click()
    
    setIsOpen(false)
  }

  const canPublish = ticket.status === 'DRAFT'
  const canUnpublish = ticket.status === 'ACTIVE' && ticket.soldQuantity === 0
  const canPause = ticket.status === 'ACTIVE'
  const canResume = ticket.status === 'PAUSED'
  const canCancel = ticket.status !== 'CANCELLED'
  const canDelete = ticket.soldQuantity === 0

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
            {/* Publish Button - Show prominently for draft tickets */}
            {canPublish && (
              <button
                onClick={() => handleStatusChange('ACTIVE')}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-green-700 hover:bg-green-50 border-b border-gray-100"
              >
                <Send className="h-4 w-4" />
                <span className="font-medium">Publish Ticket</span>
              </button>
            )}
            
            <button
              onClick={() => {
                router.push(`/org/${ticket.organization.slug}/houses/${ticket.house?.slug}/tickets/${ticket.id}/edit`)
                setIsOpen(false)
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Edit className="h-4 w-4" />
              Edit Ticket
            </button>
            
            <button
              onClick={handleDuplicate}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Copy className="h-4 w-4" />
              Duplicate
            </button>
            
            <button
              onClick={handleExport}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Download className="h-4 w-4" />
              Export Data
            </button>

            <div className="border-t border-gray-100 my-1" />

            {/* Status change options */}
            {canUnpublish && (
              <button
                onClick={() => handleStatusChange('DRAFT')}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                <EyeOff className="h-4 w-4" />
                Unpublish
              </button>
            )}

            {canPause && (
              <button
                onClick={() => handleStatusChange('PAUSED')}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-yellow-700 hover:bg-yellow-50"
              >
                <Pause className="h-4 w-4" />
                Pause Sales
              </button>
            )}

            {canResume && (
              <button
                onClick={() => handleStatusChange('ACTIVE')}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-green-700 hover:bg-green-50"
              >
                <Play className="h-4 w-4" />
                Resume Sales
              </button>
            )}

            {canCancel && (
              <button
                onClick={() => handleStatusChange('CANCELLED')}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-700 hover:bg-red-50"
              >
                <Archive className="h-4 w-4" />
                Cancel Ticket
              </button>
            )}

            {canDelete && (
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
                  Delete Ticket
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Ticket</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete "{ticket.name}"? This action cannot be undone.
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