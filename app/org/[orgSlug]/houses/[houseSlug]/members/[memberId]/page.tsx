// app/org/[orgSlug]/houses/[houseSlug]/members/[memberId]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Receipt,
  Send,
  Pause,
  Ban,
  Play,
  Edit,
  Save,
  Loader2,
  Shield,
  Crown,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  DollarSign,
  Eye,
  Download,
  RefreshCw,
} from 'lucide-react'

interface MemberDetail {
  member: any
  communications: any[]
  auditLogs: any[]
  availablePlans: any[]
}

export default function MemberDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orgSlug = params?.orgSlug as string
  const houseSlug = params?.houseSlug as string
  const memberId = params?.memberId as string

  const [isLoading, setIsLoading] = useState(true)
  const [memberData, setMemberData] = useState<MemberDetail | null>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'billing' | 'communications' | 'logs'>('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [showChargeModal, setShowChargeModal] = useState(false)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [showPauseModal, setShowPauseModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [chargeAmount, setChargeAmount] = useState('')
  const [chargeDescription, setChargeDescription] = useState('')
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [selectedPrice, setSelectedPrice] = useState<any>(null)
  const [pauseReason, setPauseReason] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [membershipNumber, setMembershipNumber] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('')
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false)

  useEffect(() => {
    fetchMemberData()
  }, [memberId])

  const fetchMemberData = async () => {
    try {
      const response = await fetch(`/api/org/${orgSlug}/houses/${houseSlug}/members/${memberId}`)
      const data = await response.json()
      
      if (response.ok) {
        setMemberData(data)
        setMembershipNumber(data.member.membershipNumber || '')
      } else {
        toast.error(data.error || 'Failed to load member')
      }
    } catch (error) {
      toast.error('Failed to load member')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch(`/api/org/${orgSlug}/houses/${houseSlug}/members/${memberId}/payment-methods`)
      const data = await response.json()
      
      if (response.ok) {
        setPaymentMethods(data.paymentMethods || [])
        setSelectedPaymentMethodId(data.defaultPaymentMethodId || data.paymentMethods?.[0]?.id || '')
        setHasPaymentMethod(data.hasPaymentMethod)
      }
    } catch (error) {
      console.error('Failed to fetch payment methods:', error)
    }
  }

  const handleOpenChargeModal = () => {
    fetchPaymentMethods()
    setShowChargeModal(true)
  }

  const handleUpdateMember = async () => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch(`/api/org/${orgSlug}/houses/${houseSlug}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          membershipNumber
        })
      })

      if (response.ok) {
        toast.success('Member updated')
        fetchMemberData()
        setIsEditing(false)
      } else {
        toast.error('Failed to update member')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChargeMember = async () => {
    if (!chargeAmount || parseFloat(chargeAmount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (!hasPaymentMethod) {
      toast.error('Member has no payment method on file')
      return
    }

    setIsSubmitting(true)
    
    try {
      const response = await fetch(`/api/org/${orgSlug}/houses/${houseSlug}/members/${memberId}/charge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(chargeAmount),
          currency: 'USD',
          description: chargeDescription || 'Manual charge',
          paymentMethodId: selectedPaymentMethodId || undefined
        })
      })

      const data = await response.json()

      if (response.ok) {
        if (data.success) {
          toast.success('Payment successful')
          setShowChargeModal(false)
          setChargeAmount('')
          setChargeDescription('')
          fetchMemberData()
        } else if (data.requiresAction) {
          toast.error('This payment requires 3D Secure authentication. Please ask the member to complete payment in their portal.')
        } else {
          toast.error(data.error || 'Payment failed')
        }
      } else {
        toast.error(data.error || 'Payment failed')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChangePlan = async () => {
    if (!selectedPlan || !selectedPrice) {
      toast.error('Please select a plan and price')
      return
    }

    setIsSubmitting(true)
    
    try {
      const response = await fetch(`/api/org/${orgSlug}/houses/${houseSlug}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planChange: {
            planId: selectedPlan.id,
            priceId: selectedPrice.id,
            billingFrequency: selectedPrice.billingFrequency,
            amount: selectedPrice.amount,
            currency: selectedPrice.currency
          }
        })
      })

      if (response.ok) {
        toast.success('Plan changed successfully')
        setShowPlanModal(false)
        setSelectedPlan(null)
        setSelectedPrice(null)
        fetchMemberData()
      } else {
        toast.error('Failed to change plan')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePauseMember = async () => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch(`/api/org/${orgSlug}/houses/${houseSlug}/members/${memberId}/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: pauseReason })
      })

      if (response.ok) {
        toast.success('Membership paused')
        setShowPauseModal(false)
        setPauseReason('')
        fetchMemberData()
      } else {
        toast.error('Failed to pause membership')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelMember = async () => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch(`/api/org/${orgSlug}/houses/${houseSlug}/members/${memberId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason })
      })

      if (response.ok) {
        toast.success('Membership cancelled')
        setShowCancelModal(false)
        setCancelReason('')
        fetchMemberData()
      } else {
        toast.error('Failed to cancel membership')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResumeMember = async () => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch(`/api/org/${orgSlug}/houses/${houseSlug}/members/${memberId}/resume`, {
        method: 'POST'
      })

      if (response.ok) {
        toast.success('Membership resumed')
        fetchMemberData()
      } else {
        toast.error('Failed to resume membership')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSendPasswordReset = async () => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch(`/api/org/${orgSlug}/houses/${houseSlug}/members/${memberId}/reset-password`, {
        method: 'POST'
      })

      if (response.ok) {
        toast.success('Password reset email sent')
      } else {
        toast.error('Failed to send reset email')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getRoleBadge = (role: string) => {
    const configs: Record<string, { label: string; color: string; icon: any }> = {
      HOUSE_MANAGER: { label: 'Manager', color: 'bg-purple-100 text-purple-800', icon: Crown },
      HOUSE_ADMIN: { label: 'Admin', color: 'bg-blue-100 text-blue-800', icon: Shield },
      HOUSE_STAFF: { label: 'Staff', color: 'bg-green-100 text-green-800', icon: Shield },
      HOUSE_MEMBER: { label: 'Member', color: 'bg-gray-100 text-gray-800', icon: Users },
    }
    const config = configs[role] || configs.HOUSE_MEMBER
    const Icon = config.icon
    
    return (
      <span className={`text-xs px-2 py-1 rounded-full inline-flex items-center gap-1 ${config.color}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    )
  }

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { label: string; color: string; icon: any }> = {
      ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      PAUSED: { label: 'Paused', color: 'bg-orange-100 text-orange-800', icon: Pause },
      CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
      EXPIRED: { label: 'Expired', color: 'bg-gray-100 text-gray-800', icon: AlertCircle },
    }
    const config = configs[status] || { label: status, color: 'bg-gray-100 text-gray-800', icon: AlertCircle }
    const Icon = config.icon
    
    return (
      <span className={`text-xs px-2 py-1 rounded-full inline-flex items-center gap-1 ${config.color}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (!memberData) {
    return <div>Member not found</div>
  }

  const member = memberData.member
  const user = member.membership.user
  const profile = member.memberProfile
  const activeSubscription = member.membershipItems?.find((item: any) => item.status === 'ACTIVE')
  const isActive = member.status === 'ACTIVE'
  const isPaused = member.status === 'PAUSED'
  const isCancelled = member.status === 'CANCELLED'

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back Navigation */}
      <Link
        href={`/org/${orgSlug}/houses/${houseSlug}/members`}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Members
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              {user.image ? (
                <img src={user.image} alt="" className="w-16 h-16 rounded-full" />
              ) : (
                <span className="text-white text-2xl font-bold">
                  {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{user.name || 'Unknown'}</h1>
                {getRoleBadge(member.role)}
                {getStatusBadge(member.status)}
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </p>
                {user.phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {user.phone}
                  </p>
                )}
                <p className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Member since {new Date(member.joinedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleSendPasswordReset}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Send className="h-4 w-4" />
              Reset Password
            </button>
            
            {isActive && (
              <>
                <button
                  onClick={handleOpenChargeModal}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                >
                  <DollarSign className="h-4 w-4" />
                  Charge
                </button>
                <button
                  onClick={() => setShowPauseModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-yellow-700 bg-yellow-50 rounded-lg hover:bg-yellow-100 border border-yellow-200"
                >
                  <Pause className="h-4 w-4" />
                  Pause
                </button>
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 border border-red-200"
                >
                  <Ban className="h-4 w-4" />
                  Cancel
                </button>
              </>
            )}
            {isPaused && (
              <button
                onClick={handleResumeMember}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 border border-green-200"
              >
                <Play className="h-4 w-4" />
                Resume
              </button>
            )}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Edit className="h-4 w-4" />
              Edit
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex gap-6 px-6">
            {[
              { id: 'profile', label: 'Profile' },
              { id: 'billing', label: 'Billing & Plan' },
              { id: 'communications', label: 'Communications' },
              { id: 'logs', label: 'Audit Logs' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 text-sm font-medium border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-purple-600 text-purple-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Membership Number */}
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Membership Number
                </label>
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={membershipNumber}
                      onChange={(e) => setMembershipNumber(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="e.g., M2024001"
                    />
                    <button
                      onClick={handleUpdateMember}
                      disabled={isSubmitting}
                      className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                    >
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <p className="text-lg font-mono text-gray-900">
                    {member.membershipNumber || '—'}
                  </p>
                )}
              </div>

              {/* Profile Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Personal Information</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <dt className="text-gray-500">Full Name</dt>
                      <dd className="font-medium text-gray-900">{user.name || '—'}</dd>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <dt className="text-gray-500">Email</dt>
                      <dd className="font-medium text-gray-900">{user.email}</dd>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <dt className="text-gray-500">Phone</dt>
                      <dd className="font-medium text-gray-900">{profile?.phone || user.phone || '—'}</dd>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <dt className="text-gray-500">Email Verified</dt>
                      <dd className="font-medium text-gray-900">
                        {user.emailVerified ? (
                          <span className="text-green-600 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" /> Yes
                          </span>
                        ) : (
                          <span className="text-yellow-600 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> No
                          </span>
                        )}
                      </dd>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <dt className="text-gray-500">Last Login</dt>
                      <dd className="font-medium text-gray-900">
                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}
                      </dd>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <dt className="text-gray-500">Account Created</dt>
                      <dd className="font-medium text-gray-900">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Professional Information</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <dt className="text-gray-500">Job Title</dt>
                      <dd className="font-medium text-gray-900">{profile?.jobTitle || '—'}</dd>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <dt className="text-gray-500">Company</dt>
                      <dd className="font-medium text-gray-900">{profile?.company || '—'}</dd>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <dt className="text-gray-500">Industry</dt>
                      <dd className="font-medium text-gray-900">{profile?.industry || '—'}</dd>
                    </div>
                    {profile?.skills && (profile.skills as string[]).length > 0 && (
                      <div className="py-2 border-b border-gray-100">
                        <dt className="text-gray-500 mb-1">Skills</dt>
                        <dd className="flex flex-wrap gap-1">
                          {(profile.skills as string[]).map((skill, i) => (
                            <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                              {skill}
                            </span>
                          ))}
                        </dd>
                      </div>
                    )}
                    {profile?.interests && (profile.interests as string[]).length > 0 && (
                      <div className="py-2">
                        <dt className="text-gray-500 mb-1">Interests</dt>
                        <dd className="flex flex-wrap gap-1">
                          {(profile.interests as string[]).map((interest, i) => (
                            <span key={i} className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full">
                              {interest}
                            </span>
                          ))}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>

              {/* Bio */}
              {profile?.bio && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Bio</h3>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-4">{profile.bio}</p>
                </div>
              )}
            </div>
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              {/* Current Plan */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">Current Plan</h3>
                  <button
                    onClick={() => setShowPlanModal(true)}
                    className="text-sm text-purple-600 hover:text-purple-700"
                  >
                    Change Plan
                  </button>
                </div>
                
                {activeSubscription ? (
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{activeSubscription.membershipPlan?.name}</p>
                        <p className="text-sm text-gray-600">
                          {activeSubscription.currency} {activeSubscription.amount.toFixed(2)} / {activeSubscription.billingFrequency?.toLowerCase().replace('_', ' ')}
                        </p>
                        {activeSubscription.initiationFeePaid > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            Initiation fee paid: {activeSubscription.currency} {activeSubscription.initiationFeePaid.toFixed(2)}
                          </p>
                        )}
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        activeSubscription.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {activeSubscription.status}
                      </span>
                    </div>
                    {activeSubscription.nextBillingDate && (
                      <p className="text-xs text-gray-500 mt-2">
                        Next billing: {new Date(activeSubscription.nextBillingDate).toLocaleDateString()}
                      </p>
                    )}
                    {activeSubscription.startDate && (
                      <p className="text-xs text-gray-500">
                        Started: {new Date(activeSubscription.startDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">No active subscription</p>
                )}
              </div>

              {/* Payment Methods */}
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Payment Methods</h3>
                
                {paymentMethods.length === 0 ? (
                  <p className="text-gray-500">No payment methods on file</p>
                ) : (
                  <div className="space-y-2">
                    {paymentMethods.map((method) => (
                      <div key={method.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900 capitalize">{method.brand}</p>
                            <p className="text-sm text-gray-500">
                              •••• {method.last4} | Expires {method.expMonth}/{method.expYear}
                            </p>
                          </div>
                        </div>
                        {method.isDefault && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment History */}
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Payment History</h3>
                
                {member.payments?.length === 0 ? (
                  <p className="text-gray-500">No payments yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Description</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Amount</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {member.payments.map((payment: any) => (
                          <tr key={payment.id} className="border-b border-gray-100">
                            <td className="px-4 py-2">{new Date(payment.createdAt).toLocaleDateString()}</td>
                            <td className="px-4 py-2">{payment.description || 'Membership Payment'}</td>
                            <td className="px-4 py-2">{payment.currency} {payment.amount.toFixed(2)}</td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                payment.status === 'SUCCEEDED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {payment.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Invoices */}
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Invoices</h3>
                
                {member.invoices?.length === 0 ? (
                  <p className="text-gray-500">No invoices yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Invoice #</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Amount</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {member.invoices.map((invoice: any) => (
                          <tr key={invoice.id} className="border-b border-gray-100">
                            <td className="px-4 py-2 font-mono">{invoice.invoiceNumber}</td>
                            <td className="px-4 py-2">{new Date(invoice.createdAt).toLocaleDateString()}</td>
                            <td className="px-4 py-2">{invoice.currency} {invoice.amount.toFixed(2)}</td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                invoice.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {invoice.status}
                              </span>
                            </td>
                            <td className="px-4 py-2">
                              <button className="text-purple-600 hover:text-purple-700">
                                <Download className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Cancellation Requests */}
              {member.cancellationRequests?.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Cancellation Requests</h3>
                  <div className="space-y-2">
                    {member.cancellationRequests.map((request: any) => (
                      <div key={request.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            request.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            request.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {request.status}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900">{request.reason}</p>
                        {request.reasonDetail && (
                          <p className="text-sm text-gray-600 mt-1">{request.reasonDetail}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          Effective: {new Date(request.effectiveDate).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Communications Tab */}
          {activeTab === 'communications' && (
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Email Communications</h3>
              
              {memberData.communications.length === 0 ? (
                <p className="text-gray-500">No communications sent yet</p>
              ) : (
                <div className="space-y-3">
                  {memberData.communications.map((comm: any) => (
                    <div key={comm.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-gray-900">{comm.subject}</p>
                        <span className="text-xs text-gray-500">
                          {new Date(comm.sentAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-3">{comm.body}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>📧 Sent to {comm.sentCount} recipients</span>
                        <span>👁️ Opened: {comm.openedCount} times</span>
                        <span>🔗 Clicked: {comm.clickedCount} times</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Audit Logs Tab */}
          {activeTab === 'logs' && (
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Audit Logs</h3>
              
              {memberData.auditLogs.length === 0 ? (
                <p className="text-gray-500">No audit logs yet</p>
              ) : (
                <div className="space-y-2">
                  {memberData.auditLogs.map((log: any) => (
                    <div key={log.id} className="flex items-start gap-3 text-sm py-2 border-b border-gray-100">
                      <div className="w-40 flex-shrink-0 text-gray-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                      <div className="w-48 flex-shrink-0">
                        <span className="font-medium text-gray-900">{log.action}</span>
                      </div>
                      <div className="flex-1 text-gray-500">
                        by {log.user?.name || log.userEmail || 'System'}
                      </div>
                      {log.metadata && (
                        <button
                          className="text-gray-400 hover:text-gray-600"
                          onClick={() => toast.success(JSON.stringify(log.metadata, null, 2))}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Charge Modal */}
      {showChargeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/30" onClick={() => setShowChargeModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Charge Member</h3>
            
            {!hasPaymentMethod ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  This member does not have a payment method on file. They need to add a card in their portal first.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (USD) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={chargeAmount}
                      onChange={(e) => setChargeAmount(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={chargeDescription}
                    onChange={(e) => setChargeDescription(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg"
                    placeholder="e.g., Event ticket, Dues"
                  />
                </div>
                
                {paymentMethods.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {paymentMethods.map((method) => (
                        <label
                          key={method.id}
                          className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition ${
                            selectedPaymentMethodId === method.id
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="paymentMethod"
                              checked={selectedPaymentMethodId === method.id}
                              onChange={() => setSelectedPaymentMethodId(method.id)}
                              className="text-purple-600"
                            />
                            <div>
                              <p className="font-medium text-gray-900 capitalize">
                                {method.brand} •••• {method.last4}
                              </p>
                              <p className="text-xs text-gray-500">
                                Expires {method.expMonth}/{method.expYear}
                              </p>
                            </div>
                          </div>
                          {method.isDefault && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              Default
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowChargeModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              {hasPaymentMethod && (
                <button
                  onClick={handleChargeMember}
                  disabled={isSubmitting || !chargeAmount}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Charge'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Change Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/30" onClick={() => setShowPlanModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Plan</h3>
            
            <div className="space-y-4">
              {memberData.availablePlans.map((plan: any) => (
                <div key={plan.id} className={`border rounded-lg p-4 ${
                  selectedPlan?.id === plan.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                }`}>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="plan"
                      checked={selectedPlan?.id === plan.id}
                      onChange={() => {
                        setSelectedPlan(plan)
                        setSelectedPrice(null)
                      }}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{plan.name}</p>
                      <p className="text-sm text-gray-600">{plan.description}</p>
                    </div>
                  </label>
                  
                  {selectedPlan?.id === plan.id && (
                    <div className="mt-4 ml-6 space-y-2">
                      <p className="text-sm font-medium text-gray-700">Select billing frequency:</p>
                      {plan.prices.map((price: any) => (
                        <label key={price.id} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="price"
                            checked={selectedPrice?.id === price.id}
                            onChange={() => setSelectedPrice(price)}
                          />
                          <span className="text-sm">
                            {price.currency} {price.amount.toFixed(2)} / {price.billingFrequency.toLowerCase().replace('_', ' ')}
                            {price.setupFee > 0 && (
                              <span className="text-gray-500"> (+{price.currency} {price.setupFee} setup)</span>
                            )}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowPlanModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePlan}
                disabled={isSubmitting || !selectedPlan || !selectedPrice}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Change Plan'}
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pause Membership</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason (Optional)
              </label>
              <textarea
                value={pauseReason}
                onChange={(e) => setPauseReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Reason for pausing..."
              />
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowPauseModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePauseMember}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-lg hover:bg-yellow-700 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Pause'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/30" onClick={() => setShowCancelModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cancel Membership</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason (Optional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Reason for cancellation..."
              />
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-3 mt-4">
              <p className="text-sm text-yellow-800">
                This will cancel the membership and stop all future billing.
              </p>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCancelMember}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cancel Membership'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}