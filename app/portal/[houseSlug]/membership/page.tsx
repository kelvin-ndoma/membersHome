// app/portal/[houseSlug]/membership/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import {
  Crown,
  Calendar,
  CreditCard,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Pause,
  Play,
  Ban,
  Loader2,
  Shield,
  Star,
  Zap,
  Gem,
  Eye,
  History,
} from 'lucide-react'
import Link from 'next/link'

interface MembershipData {
  house: {
    id: string
    name: string
    slug: string
    description: string | null
  }
  membership: {
    id: string
    role: string
    status: string
    membershipNumber: string | null
    joinedAt: string | null
  }
  subscription: any
  availablePlans: any[]
  profile: any
}

// Helper function to safely format date
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A'
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'N/A'
    
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  } catch {
    return 'N/A'
  }
}

export default function MembershipPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const houseSlug = params?.houseSlug as string
  
  const [isLoading, setIsLoading] = useState(true)
  const [membershipData, setMembershipData] = useState<MembershipData | null>(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showPauseModal, setShowPauseModal] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [cancellationReason, setCancellationReason] = useState('')
  const [cancellationDetail, setCancellationDetail] = useState('')
  const [feedback, setFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchMembershipData()
  }, [houseSlug])

  const fetchMembershipData = async () => {
    try {
      const response = await fetch(`/api/portal/${houseSlug}/membership`)
      const data = await response.json()
      
      if (response.ok) {
        setMembershipData(data)
      } else {
        toast.error(data.error || 'Failed to load membership information')
      }
    } catch (error) {
      toast.error('Failed to load membership information')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelMembership = async () => {
    if (!cancellationReason) {
      toast.error('Please select a reason')
      return
    }

    setIsSubmitting(true)
    
    try {
      const response = await fetch(`/api/portal/${houseSlug}/membership/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: cancellationReason,
          reasonDetail: cancellationDetail,
          feedback
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || 'Cancellation request submitted')
        setShowCancelModal(false)
        setCancellationReason('')
        setCancellationDetail('')
        setFeedback('')
        fetchMembershipData()
      } else {
        toast.error(data.error || 'Failed to submit cancellation request')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePauseMembership = async () => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch(`/api/portal/${houseSlug}/membership/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: 'Taking a break'
        })
      })

      if (response.ok) {
        toast.success('Membership paused successfully')
        setShowPauseModal(false)
        fetchMembershipData()
      } else {
        toast.error('Failed to pause membership')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResumeMembership = async () => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch(`/api/portal/${houseSlug}/membership/resume`, {
        method: 'POST'
      })

      if (response.ok) {
        toast.success('Membership resumed successfully')
        fetchMembershipData()
      } else {
        toast.error('Failed to resume membership')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpgrade = (plan: any) => {
    setSelectedPlan(plan)
    setShowUpgradeModal(true)
  }

  const confirmUpgrade = async () => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch(`/api/portal/${houseSlug}/membership/upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan.id
        })
      })

      if (response.ok) {
        toast.success('Membership upgraded successfully')
        setShowUpgradeModal(false)
        fetchMembershipData()
      } else {
        toast.error('Failed to upgrade membership')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getPlanIcon = (type: string) => {
    switch (type) {
      case 'PREMIUM': return <Star className="h-5 w-5" />
      case 'VIP': return <Crown className="h-5 w-5" />
      case 'STANDARD': return <Shield className="h-5 w-5" />
      default: return <Zap className="h-5 w-5" />
    }
  }

  const getPlanColor = (type: string) => {
    switch (type) {
      case 'PREMIUM': return 'from-blue-500 to-indigo-500'
      case 'VIP': return 'from-amber-500 to-orange-500'
      case 'STANDARD': return 'from-green-500 to-emerald-500'
      default: return 'from-purple-500 to-pink-500'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  const house = membershipData?.house
  const membership = membershipData?.membership
  const subscription = membershipData?.subscription
  const availablePlans = membershipData?.availablePlans || []
  const isActive = subscription?.status === 'ACTIVE'
  const isPaused = subscription?.status === 'PAUSED'
  const isCancelled = subscription?.status === 'CANCELLED'
  const isFree = !subscription || subscription.amount === 0

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Membership</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your membership and view plan details
        </p>
      </div>

      {/* Current Membership Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className={`h-2 bg-gradient-to-r ${subscription ? getPlanColor(subscription.membershipPlan?.type) : 'from-gray-400 to-gray-500'}`} />
        
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${subscription ? getPlanColor(subscription.membershipPlan?.type) : 'from-gray-400 to-gray-500'} flex items-center justify-center`}>
                {subscription ? getPlanIcon(subscription.membershipPlan?.type) : <Crown className="h-7 w-7 text-white" />}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {subscription?.membershipPlan?.name || 'Free Member'}
                </h2>
                <p className="text-gray-600">
                  {house?.name || 'House'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {isActive && (
                <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Active
                </span>
              )}
              {isPaused && (
                <span className="px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full flex items-center gap-1">
                  <Pause className="h-3 w-3" />
                  Paused
                </span>
              )}
              {isCancelled && (
                <span className="px-3 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  Cancelled
                </span>
              )}
              {isFree && (
                <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  Free Plan
                </span>
              )}
            </div>
          </div>
          
          {/* Membership Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Member Since</p>
              <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                {formatDate(membership?.joinedAt)}
              </p>
            </div>
            
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Membership Number</p>
              <p className="text-sm font-medium text-gray-900 font-mono">
                {membership?.membershipNumber || '—'}
              </p>
            </div>
            
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Role</p>
              <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-400" />
                {membership?.role?.replace('HOUSE_', '') || 'Member'}
              </p>
            </div>
          </div>
          
          {/* Billing Info */}
          {subscription && !isFree && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Billing Amount</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {subscription.currency} {subscription.amount.toFixed(2)}
                    <span className="text-sm font-normal text-gray-500 ml-1">
                      / {subscription.billingFrequency?.toLowerCase().replace('_', ' ')}
                    </span>
                  </p>
                </div>
                
                {subscription.nextBillingDate && (
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Next Billing Date</p>
                    <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                      <Clock className="h-4 w-4 text-gray-400" />
                      {formatDate(subscription.nextBillingDate)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-3">
          {/* View Details Button */}
          <button
            onClick={() => setShowDetailsModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <Eye className="h-4 w-4" />
            View Details
          </button>
          
          {/* Billing History */}
          <Link
            href={`/portal/${houseSlug}/billing`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <History className="h-4 w-4" />
            Billing History
          </Link>
          
          {isActive && !isFree && (
            <>
              <button
                onClick={() => setShowPauseModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-yellow-700 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition border border-yellow-200"
              >
                <Pause className="h-4 w-4" />
                Pause Membership
              </button>
              <button
                onClick={() => setShowCancelModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition border border-red-200"
              >
                <Ban className="h-4 w-4" />
                Cancel Membership
              </button>
            </>
          )}
          
          {isPaused && (
            <button
              onClick={handleResumeMembership}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition border border-green-200"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Resume Membership
            </button>
          )}
          
          <Link
            href={`/portal/${houseSlug}/billing`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition"
          >
            <CreditCard className="h-4 w-4" />
            Manage Payment Methods
          </Link>
        </div>
      </div>

      {/* Available Plans (for upgrade) */}
      {isActive && availablePlans.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Available Plans</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {availablePlans.map((plan) => {
              const isCurrentPlan = subscription?.membershipPlan?.id === plan.id
              const lowestPrice = plan.prices[0]
              
              return (
                <div 
                  key={plan.id}
                  className={`bg-white rounded-xl border-2 overflow-hidden transition ${
                    isCurrentPlan 
                      ? 'border-purple-400 shadow-md' 
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className={`h-1.5 bg-gradient-to-r ${getPlanColor(plan.type)}`} />
                  
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getPlanColor(plan.type)} flex items-center justify-center`}>
                        {getPlanIcon(plan.type)}
                      </div>
                      <h4 className="font-semibold text-gray-900">{plan.name}</h4>
                      {isCurrentPlan && (
                        <span className="ml-auto text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{plan.description}</p>
                    
                    {lowestPrice && (
                      <p className="text-xl font-bold text-gray-900 mb-4">
                        {lowestPrice.currency} {lowestPrice.amount.toFixed(2)}
                        <span className="text-sm font-normal text-gray-500">
                          /{lowestPrice.billingFrequency.toLowerCase().replace('_', ' ')}
                        </span>
                      </p>
                    )}
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedPlan(plan)
                          setShowDetailsModal(true)
                        }}
                        className="flex-1 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                      >
                        Details
                      </button>
                      {!isCurrentPlan && (
                        <button
                          onClick={() => handleUpgrade(plan)}
                          className="flex-1 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition"
                        >
                          Switch
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Benefits Section */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Gem className="h-5 w-5 text-purple-600" />
          Membership Benefits
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            'Access to exclusive member events',
            'Member directory access',
            'Direct messaging with other members',
            'Early access to ticket sales',
            'Member-only content and resources',
            'Priority support',
          ].map((benefit, index) => (
            <div key={index} className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span className="text-sm text-gray-700">{benefit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && membership && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/30" onClick={() => setShowDetailsModal(false)} />
          
          <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Membership Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Basic Information</h4>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-gray-500">Member Name</dt>
                    <dd className="font-medium text-gray-900">
                      {membershipData?.profile?.user?.name || session?.user?.name || '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Email</dt>
                    <dd className="font-medium text-gray-900">
                      {membershipData?.profile?.user?.email || session?.user?.email || '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Member Since</dt>
                    <dd className="font-medium text-gray-900">{formatDate(membership?.joinedAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Membership Number</dt>
                    <dd className="font-medium text-gray-900 font-mono">{membership?.membershipNumber || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Status</dt>
                    <dd className="font-medium text-gray-900">{membership?.status}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Role</dt>
                    <dd className="font-medium text-gray-900">{membership?.role?.replace('HOUSE_', '')}</dd>
                  </div>
                  {membershipData?.profile?.phone && (
                    <div className="col-span-2">
                      <dt className="text-gray-500">Phone</dt>
                      <dd className="font-medium text-gray-900">{membershipData.profile.phone}</dd>
                    </div>
                  )}
                </dl>
              </div>
              
              {/* Plan Details */}
              {subscription && (
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Current Plan</h4>
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-gray-500">Plan Name</dt>
                      <dd className="font-medium text-gray-900">{subscription.membershipPlan?.name}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Billing Frequency</dt>
                      <dd className="font-medium text-gray-900">{subscription.billingFrequency?.toLowerCase().replace('_', ' ')}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Amount</dt>
                      <dd className="font-medium text-gray-900">{subscription.currency} {subscription.amount.toFixed(2)}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Next Billing</dt>
                      <dd className="font-medium text-gray-900">{formatDate(subscription.nextBillingDate)}</dd>
                    </div>
                    {subscription.initiationFeePaid > 0 && (
                      <div className="col-span-2">
                        <dt className="text-gray-500">Initiation Fee Paid</dt>
                        <dd className="font-medium text-gray-900">{subscription.currency} {subscription.initiationFeePaid.toFixed(2)}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}
              
              {/* Features */}
              {subscription?.membershipPlan?.features && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Plan Features</h4>
                  <ul className="space-y-2">
                    {(subscription.membershipPlan.features as string[]).map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Actions from Details Modal */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Membership Actions</h4>
                <div className="flex flex-wrap gap-2">
                  {isActive && !isFree && (
                    <>
                      <button
                        onClick={() => {
                          setShowDetailsModal(false)
                          setShowPauseModal(true)
                        }}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-yellow-700 bg-yellow-50 rounded-lg hover:bg-yellow-100 border border-yellow-200"
                      >
                        <Pause className="h-4 w-4" />
                        Pause Membership
                      </button>
                      <button
                        onClick={() => {
                          setShowDetailsModal(false)
                          setShowCancelModal(true)
                        }}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 border border-red-200"
                      >
                        <Ban className="h-4 w-4" />
                        Cancel Membership
                      </button>
                    </>
                  )}
                  {isPaused && (
                    <button
                      onClick={() => {
                        setShowDetailsModal(false)
                        handleResumeMembership()
                      }}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 border border-green-200"
                    >
                      <Play className="h-4 w-4" />
                      Resume Membership
                    </button>
                  )}
                  <Link
                    href={`/portal/${houseSlug}/billing`}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100"
                  >
                    <CreditCard className="h-4 w-4" />
                    Manage Billing
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/30" onClick={() => setShowCancelModal(false)} />
          
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <Ban className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Cancel Membership</h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              We're sorry to see you go. Please let us know why you're cancelling.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for cancellation *
                </label>
                <select
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Select a reason</option>
                  <option value="TOO_EXPENSIVE">Too expensive</option>
                  <option value="NOT_USING">Not using the membership</option>
                  <option value="MOVING">Moving/Relocating</option>
                  <option value="HEALTH_REASONS">Health reasons</option>
                  <option value="SERVICE_ISSUES">Service issues</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional details (optional)
                </label>
                <textarea
                  value={cancellationDetail}
                  onChange={(e) => setCancellationDetail(e.target.value)}
                  rows={2}
                  placeholder="Tell us more..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feedback for us (optional)
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={2}
                  placeholder="Any feedback to help us improve?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>
              
              <div className="bg-yellow-50 rounded-lg p-3">
                <p className="text-sm text-yellow-800 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>
                    Your access will continue until the end of your current billing period (30 days notice).
                    You will not be charged again after cancellation.
                  </span>
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Keep Membership
              </button>
              <button
                onClick={handleCancelMembership}
                disabled={isSubmitting || !cancellationReason}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pause Modal */}
      {showPauseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/30" onClick={() => setShowPauseModal(false)} />
          
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-100 rounded-full">
                <Pause className="h-5 w-5 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Pause Membership</h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Pause your membership temporarily. You won't be charged during this time, and your benefits will be paused.
            </p>
            
            <div className="bg-blue-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                You can resume your membership at any time from this page.
              </p>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowPauseModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePauseMembership}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-lg hover:bg-yellow-700 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Pause Membership'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/30" onClick={() => setShowUpgradeModal(false)} />
          
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-full bg-gradient-to-br ${getPlanColor(selectedPlan.type)}`}>
                {getPlanIcon(selectedPlan.type)}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Switch to {selectedPlan.name}</h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              You're about to switch from {subscription?.membershipPlan?.name} to {selectedPlan.name}.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">New plan amount:</span>
                <span className="font-medium">
                  {selectedPlan.prices[0]?.currency} {selectedPlan.prices[0]?.amount.toFixed(2)}/{selectedPlan.prices[0]?.billingFrequency.toLowerCase().replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Prorated adjustment:</span>
                <span className="font-medium text-green-600">Calculated at checkout</span>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmUpgrade}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Upgrade'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}