// components/portal/EventRsvpButton.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RSVPStatus } from '@prisma/client'
import toast from 'react-hot-toast'
import { 
  CheckCircle, 
  XCircle, 
  Loader2,
  Clock,
  Ban,
  Minus,
  Plus,
  Users,
  Check,
} from 'lucide-react'

interface EventRsvpButtonProps {
  eventId: string
  houseSlug: string
  initialStatus?: RSVPStatus | null
  guestsCount?: number
  capacity?: number | null
  currentAttendees?: number
  memberAccessId?: string
  startDate?: Date
  maxGuests?: number
  requireApproval?: boolean
}

export default function EventRsvpButton({
  eventId,
  houseSlug,
  initialStatus,
  guestsCount: initialGuests = 0,
  capacity,
  currentAttendees = 0,
  memberAccessId,
  startDate,
  maxGuests = 1,
  requireApproval = false,
}: EventRsvpButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [status, setStatus] = useState<RSVPStatus | null>(initialStatus || null)
  const [guestsCount, setGuestsCount] = useState(initialGuests)
  const [notes, setNotes] = useState('')

  const isPast = startDate ? new Date(startDate) < new Date() : false
  const isFull = capacity ? currentAttendees >= capacity : false
  const canRsvp = !isPast && !isFull && memberAccessId
  const hasRsvpd = status && status !== 'CANCELLED'

  const handleRsvp = async (newStatus: RSVPStatus) => {
    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/portal/${houseSlug}/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          guestsCount,
          notes,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Failed to update RSVP')
        return
      }

      setStatus(newStatus)
      setShowModal(false)
      
      if (newStatus === 'CANCELLED') {
        toast.success('RSVP cancelled')
      } else if (requireApproval) {
        toast.success('RSVP submitted for approval!')
      } else {
        toast.success(newStatus === 'CONFIRMED' ? "You're going! 🎉" : 'RSVP updated!')
      }
      
      router.refresh()
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/portal/${houseSlug}/events/${eventId}/rsvp`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Failed to cancel RSVP')
        return
      }

      setStatus(null)
      setGuestsCount(0)
      toast.success('RSVP cancelled')
      router.refresh()
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  // Past event
  if (isPast) {
    return (
      <div className="space-y-2">
        <button
          disabled
          className="px-6 py-3 text-sm font-medium text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed w-full"
        >
          <Clock className="inline h-4 w-4 mr-2" />
          Past Event
        </button>
        {hasRsvpd && (
          <p className="text-xs text-gray-500 text-center">
            You {status === 'ATTENDED' ? 'attended' : 'RSVP\'d'} this event
            {guestsCount > 0 && ` with ${guestsCount} guest${guestsCount !== 1 ? 's' : ''}`}
          </p>
        )}
      </div>
    )
  }

  // Not a member
  if (!memberAccessId) {
    return (
      <button
        disabled
        className="px-6 py-3 text-sm font-medium text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed w-full"
      >
        Members Only
      </button>
    )
  }

  // Event is full and user hasn't RSVP'd
  if (isFull && !hasRsvpd) {
    return (
      <button
        disabled
        className="px-6 py-3 text-sm font-medium text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed w-full"
      >
        <Ban className="inline h-4 w-4 mr-2" />
        Event Full
      </button>
    )
  }

  // User has RSVP'd
  if (hasRsvpd) {
    const statusConfig = {
      CONFIRMED: { color: 'bg-green-50 border-green-200', text: 'text-green-700', icon: CheckCircle },
      PENDING: { color: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700', icon: Clock },
      ATTENDED: { color: 'bg-blue-50 border-blue-200', text: 'text-blue-700', icon: CheckCircle },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.CONFIRMED
    const StatusIcon = config.icon

    return (
      <div className="space-y-2">
        <div className={`px-4 py-3 rounded-lg border ${config.color}`}>
          <div className="flex items-center gap-2">
            <StatusIcon className={`h-5 w-5 ${config.text}`} />
            <span className={`font-medium ${config.text}`}>
              {status === 'CONFIRMED' ? "You're Going! 🎉" : 
               status === 'PENDING' ? 'Pending Approval' : 'Attended'}
            </span>
          </div>
          {guestsCount > 0 && (
            <p className="text-sm mt-1 ml-7">
              +{guestsCount} guest{guestsCount !== 1 ? 's' : ''}
            </p>
          )}
          {status === 'PENDING' && requireApproval && (
            <p className="text-xs mt-1 ml-7 opacity-75">Awaiting organizer approval</p>
          )}
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Update
          </button>
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Cancel'}
          </button>
        </div>
      </div>
    )
  }

  // Available to RSVP
  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={!canRsvp || isLoading}
        className="px-6 py-3 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed w-full"
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'RSVP to Attend'}
      </button>

      {/* RSVP Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/30" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {hasRsvpd ? 'Update RSVP' : 'RSVP to Event'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Guests Count */}
              {maxGuests > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="inline h-4 w-4 mr-1" />
                    Number of Guests
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setGuestsCount(Math.max(0, guestsCount - 1))}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      disabled={guestsCount <= 0}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="text-lg font-medium w-8 text-center">{guestsCount}</span>
                    <button
                      type="button"
                      onClick={() => setGuestsCount(Math.min(maxGuests, guestsCount + 1))}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      disabled={guestsCount >= maxGuests}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <span className="text-sm text-gray-500 ml-2">
                      Max {maxGuests} guest{maxGuests !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Total attendees: {guestsCount + 1} (including yourself)
                  </p>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Any dietary restrictions or comments..."
                />
              </div>

              {/* Capacity Warning */}
              {capacity && currentAttendees + guestsCount + 1 > capacity && (
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Adding {guestsCount + 1} people would exceed the event capacity ({capacity} max).
                  </p>
                </div>
              )}

              {/* Approval Notice */}
              {requireApproval && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    ℹ️ Your RSVP will require approval from the event organizer.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRsvp('CONFIRMED')}
                disabled={capacity ? currentAttendees + guestsCount + 1 > capacity : false}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm RSVP'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}