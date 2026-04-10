// components/applications/ApplicationActions.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  CheckCircle, 
  XCircle, 
  CreditCard,
  Eye,
  MoreVertical,
  Send,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface ApplicationActionsProps {
  application: {
    id: string
    status: string
    firstName: string
    lastName: string
    email: string
    organizationId: string
    houseId: string
    payments?: any[]
    membershipPlan?: {
      id: string
      name: string
    } | null
    selectedPrice?: {
      id: string
      amount: number
      currency: string
      billingFrequency: string
      setupFee?: number | null
    } | null
    isInitiationWaived?: boolean
    organization: {
      slug: string
      name?: string
    }
    house: {
      slug: string
      name?: string
    }
  }
}

export default function ApplicationActions({ application }: ApplicationActionsProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [showModal, setShowModal] = useState<'approve' | 'reject' | 'review' | 'collect-card' | 'charge-payment' | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [notes, setNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [initiationFeeWaived, setInitiationFeeWaived] = useState(application.isInitiationWaived || false)
  const [proratedAmount, setProratedAmount] = useState<number | null>(null)

  // Calculate proration when modal opens
  useEffect(() => {
    if (showModal === 'charge-payment' && application.selectedPrice) {
      const calculated = calculateProration(application.selectedPrice.amount, application.selectedPrice.billingFrequency)
      setProratedAmount(calculated)
    }
  }, [showModal, application.selectedPrice])

  const calculateProration = (amount: number, billingFrequency: string): number => {
    if (billingFrequency !== 'MONTHLY') return amount
    
    const today = new Date()
    const currentDay = today.getDate()
    
    if (currentDay === 1) return amount
    
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
    const remainingDays = daysInMonth - currentDay + 1
    const prorated = (amount / daysInMonth) * remainingDays
    
    return Math.round(prorated * 100) / 100
  }

  const handleStatusChange = async (newStatus: string, additionalData?: any) => {
    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/org/${application.organization.slug}/houses/${application.house.slug}/applications/${application.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          ...additionalData,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Failed to update application')
        return
      }

      const messages: Record<string, string> = {
        REVIEWING: 'Application moved to reviewing. Card collection email sent.',
        APPROVED: 'Application approved successfully! Membership activated.',
        REJECTED: 'Application rejected',
        AWAITING_PAYMENT: 'Card collected. Ready for payment processing.',
      }

      toast.success(messages[newStatus] || 'Application updated')
      router.refresh()
      setShowModal(null)
      setIsOpen(false)
      setNotes('')
      setRejectionReason('')
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const canMoveToReviewing = application.status === 'PENDING'
  const canCollectCard = application.status === 'REVIEWING'
  const canChargePayment = application.status === 'AWAITING_PAYMENT'
  const canReject = ['PENDING', 'REVIEWING'].includes(application.status)

  const houseName = application.house.name || 'this house'
  const hasPricing = !!application.selectedPrice
  const setupFee = application.selectedPrice?.setupFee ?? 0

  return (
    <div className="relative">
      {/* Primary Action Buttons */}
      {canMoveToReviewing && (
        <button
          onClick={() => setShowModal('review')}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
        >
          <Eye className="h-4 w-4" />
          Start Review & Request Card
        </button>
      )}

      {canCollectCard && (
        <button
          onClick={() => setShowModal('collect-card')}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition"
        >
          <CreditCard className="h-4 w-4" />
          Collect Payment Method
        </button>
      )}

      {canChargePayment && hasPricing && (
        <button
          onClick={() => setShowModal('charge-payment')}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition"
        >
          <CreditCard className="h-4 w-4" />
          Process First Payment
        </button>
      )}

      {/* More Actions Dropdown */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="ml-2 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
            {canMoveToReviewing && (
              <button
                onClick={() => {
                  setShowModal('review')
                  setIsOpen(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-blue-700 hover:bg-blue-50"
              >
                <Eye className="h-4 w-4" />
                Start Review
              </button>
            )}

            {canCollectCard && (
              <button
                onClick={() => {
                  setShowModal('collect-card')
                  setIsOpen(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-purple-700 hover:bg-purple-50"
              >
                <CreditCard className="h-4 w-4" />
                Collect Card
              </button>
            )}

            {canReject && (
              <button
                onClick={() => {
                  setShowModal('reject')
                  setIsOpen(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-700 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4" />
                Reject Application
              </button>
            )}

            <div className="border-t border-gray-100 my-1" />
            
            <button
              onClick={() => {
                window.location.href = `mailto:${application.email}?subject=Your Membership Application - ${houseName}`
                setIsOpen(false)
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Send className="h-4 w-4" />
              Email Applicant
            </button>
          </div>
        </>
      )}

      {/* Review Modal - Sends card collection email */}
      {showModal === 'review' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/30" onClick={() => setShowModal(null)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-full">
                <Eye className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Start Review & Request Card</h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Move this application to "Reviewing" status. The applicant will receive an email requesting them to add their payment method.
            </p>
            
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>What happens next:</strong>
              </p>
              <ol className="text-sm text-blue-700 mt-2 space-y-1 list-decimal list-inside">
                <li>Applicant receives email with secure link</li>
                <li>They add credit card (stored securely for future billing)</li>
                <li>Card is verified but NOT charged yet</li>
                <li>Application moves to "Awaiting Payment"</li>
              </ol>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Internal Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Add notes about this application..."
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStatusChange('REVIEWING', { 
                  notes,
                  sendCardCollectionEmail: true 
                })}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Updating...' : 'Start Review & Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collect Card Modal */}
      {showModal === 'collect-card' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/30" onClick={() => setShowModal(null)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-full">
                <CreditCard className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Collect Payment Method</h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Send an email to {application.firstName} requesting they add a payment method.
              The card will be stored securely but NOT charged yet.
            </p>
            
            <div className="bg-purple-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-purple-800">
                <strong>Card collection link will be sent to:</strong><br />
                {application.email}
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStatusChange('REVIEWING', { 
                  sendCardCollectionEmail: true 
                })}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Send Card Collection Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Process Payment Modal - Manual First Charge */}
      {showModal === 'charge-payment' && application.selectedPrice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/30" onClick={() => setShowModal(null)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-full">
                <CreditCard className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Process First Payment</h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Charge the payment method on file for {application.firstName} {application.lastName}.
              This is a MANUAL first charge. Future billing will be automatic.
            </p>

            {/* Payment Details */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Payment Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan:</span>
                  <span className="font-medium">{application.membershipPlan?.name || 'Selected Plan'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount to charge:</span>
                  <span className="font-medium">
                    {application.selectedPrice.currency} {application.selectedPrice.amount.toFixed(2)}
                  </span>
                </div>
                {setupFee > 0 && !initiationFeeWaived && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Initiation Fee:</span>
                    <span className="font-medium">
                      {application.selectedPrice.currency} {setupFee.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200">
                  <span>Total to charge:</span>
                  <span>
                    {application.selectedPrice.currency} {(() => {
                      const total = application.selectedPrice.amount + (initiationFeeWaived ? 0 : setupFee)
                      return total.toFixed(2)
                    })()}
                  </span>
                </div>
              </div>
            </div>

            {/* Initiation Fee Waiver */}
            {setupFee > 0 && (
              <div className="mb-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={initiationFeeWaived}
                    onChange={(e) => setInitiationFeeWaived(e.target.checked)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Waive Initiation Fee</span>
                    <p className="text-xs text-gray-500">
                      The initiation fee of {application.selectedPrice.currency} {setupFee.toFixed(2)} will not be charged
                    </p>
                  </div>
                </label>
              </div>
            )}

            {/* Proration Info */}
            {application.selectedPrice.billingFrequency === 'MONTHLY' && proratedAmount && proratedAmount < application.selectedPrice.amount && (
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Proration Available:</strong> Since it's not the 1st of the month, you could charge a prorated amount of {application.selectedPrice.currency} {proratedAmount.toFixed(2)} instead of the full amount.
                </p>
              </div>
            )}

            <div className="bg-yellow-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>Important:</strong> Verify that payment method is on file before charging.
                Failed payments will keep the application in "Awaiting Payment" status.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setIsLoading(true)
                  try {
                    const response = await fetch(`/api/applications/${application.id}/charge`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        amount: application.selectedPrice!.amount,
                        currency: application.selectedPrice!.currency,
                        initiationFee: !initiationFeeWaived ? setupFee : 0,
                        prorated: proratedAmount && proratedAmount < application.selectedPrice!.amount,
                        proratedAmount: proratedAmount,
                      })
                    })
                    
                    const result = await response.json()
                    
                    if (!response.ok) {
                      toast.error(result.error || 'Payment failed')
                      return
                    }
                    
                    if (result.success) {
                      toast.success('Payment successful! Membership activated.')
                      handleStatusChange('APPROVED', { 
                        membershipNumber: result.membershipNumber,
                        paymentId: result.paymentId,
                        initiationFeeWaived
                      })
                    } else {
                      toast.error('Payment failed. Card may be invalid or insufficient funds.')
                    }
                  } catch (error) {
                    toast.error('Payment processing error')
                  } finally {
                    setIsLoading(false)
                  }
                }}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : 'Charge Card & Activate Membership'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showModal === 'reject' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/30" onClick={() => setShowModal(null)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Reject Application</h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Reject {application.firstName} {application.lastName}'s application.
              Please provide a reason that will be shared with the applicant.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Rejection Reason *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                placeholder="Explain why the application was not accepted..."
                required
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!rejectionReason.trim()) {
                    toast.error('Please provide a rejection reason')
                    return
                  }
                  handleStatusChange('REJECTED', { rejectionReason })
                }}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isLoading ? 'Rejecting...' : 'Reject Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}