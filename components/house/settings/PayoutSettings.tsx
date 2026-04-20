// components/house/settings/PayoutSettings.tsx
'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Loader2, CheckCircle, AlertCircle, ExternalLink, DollarSign, Calendar } from 'lucide-react'

interface PayoutSettingsProps {
  houseId: string
  houseSlug: string
  orgSlug: string
  stripeConnectAccountId: string | null
  stripeAccountStatus: string | null
  marketplaceFeePercent: number
  payoutSchedule: string
  minimumPayoutAmount: number
}

export default function PayoutSettings({
  houseId,
  houseSlug,
  orgSlug,
  stripeConnectAccountId,
  stripeAccountStatus,
  marketplaceFeePercent,
  payoutSchedule,
  minimumPayoutAmount
}: PayoutSettingsProps) {
  const [loading, setLoading] = useState(false)
  const [accountStatus, setAccountStatus] = useState(stripeAccountStatus)
  const [accountId, setAccountId] = useState(stripeConnectAccountId)

  const fetchAccountStatus = async () => {
    try {
      const response = await fetch(`/api/stripe/connect/account-status?type=house&entityId=${houseId}`)
      const data = await response.json()
      if (data.success) {
        setAccountId(data.accountId)
        setAccountStatus(data.accountStatus)
      }
    } catch (error) {
      console.error('Failed to fetch account status:', error)
    }
  }

  useEffect(() => {
    fetchAccountStatus()
  }, [houseId])

  const handleConnectStripe = async () => {
    setLoading(true)
    try {
      const returnUrl = `${window.location.origin}/org/${orgSlug}/houses/${houseSlug}/settings/marketplace`
      const response = await fetch('/api/stripe/connect/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'house',
          entityId: houseId,
          returnUrl
        })
      })
      
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Failed to create onboarding link')
      }
    } catch (error) {
      console.error('Error creating account link:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = () => {
    if (!accountId) {
      return { text: 'Not Connected', color: 'bg-gray-100 text-gray-600', icon: null }
    }
    if (accountStatus === 'active') {
      return { text: 'Active', color: 'bg-green-100 text-green-700', icon: <CheckCircle className="h-4 w-4" /> }
    }
    return { text: 'Pending Setup', color: 'bg-yellow-100 text-yellow-700', icon: <AlertCircle className="h-4 w-4" /> }
  }

  const status = getStatusBadge()

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payout Settings</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Stripe Connect Status</p>
              <p className="text-sm text-gray-500">Receive marketplace commissions</p>
            </div>
            <div className="flex items-center gap-2">
              {status.icon}
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                {status.text}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Commission Rate</p>
              <p className="text-sm text-gray-500">Your earnings per sale</p>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="font-medium text-gray-900">{marketplaceFeePercent}%</span>
            </div>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Payout Schedule</p>
              <p className="text-sm text-gray-500">How often you receive payouts</p>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="font-medium text-gray-900 capitalize">{payoutSchedule}</span>
            </div>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-900">Minimum Payout</p>
              <p className="text-sm text-gray-500">Minimum amount before automatic payout</p>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gray-500" />
              <span className="font-medium text-gray-900">${minimumPayoutAmount}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <div className="flex items-start gap-3">
          <CreditCard className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">How it works</p>
            <ul className="text-sm text-blue-700 mt-2 space-y-1">
              <li>• Connect your Stripe account to receive marketplace commissions</li>
              <li>• Your house earns {marketplaceFeePercent}% on each marketplace sale</li>
              <li>• Funds are automatically transferred to your connected bank account</li>
              <li>• Payouts are processed {payoutSchedule} with a minimum of ${minimumPayoutAmount}</li>
            </ul>
          </div>
        </div>
      </div>

      {!accountId || accountStatus !== 'active' ? (
        <button
          onClick={handleConnectStripe}
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 font-medium"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Connecting to Stripe...
            </>
          ) : (
            <>
              <CreditCard className="h-5 w-5" />
              Connect Stripe Account to Receive Payouts
            </>
          )}
        </button>
      ) : (
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Account connected and ready to receive payouts</span>
            </div>
            <a
              href={`https://dashboard.stripe.com/connect/accounts/${accountId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
            >
              View Stripe Dashboard
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  )
}