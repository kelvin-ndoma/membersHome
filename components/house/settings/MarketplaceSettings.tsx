// components/house/settings/MarketplaceSettings.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Loader2, DollarSign, TrendingUp, AlertCircle, ShoppingBag } from 'lucide-react'
import toast from 'react-hot-toast'

interface MarketplaceSettingsProps {
  orgSlug: string
  houseSlug: string
  houseId: string
  initialFeePercent: number
  initialAutoApprove: boolean
}

export default function MarketplaceSettings({
  orgSlug,
  houseSlug,
  houseId,
  initialFeePercent,
  initialAutoApprove,
}: MarketplaceSettingsProps) {
  const router = useRouter()
  const [feePercent, setFeePercent] = useState(initialFeePercent)
  const [autoApprove, setAutoApprove] = useState(initialAutoApprove)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/org/${orgSlug}/houses/${houseSlug}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketplace: {
            feePercent: feePercent,
            autoApproveProducts: autoApprove,
          },
        }),
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Marketplace settings saved successfully')
        router.refresh()
      } else {
        toast.error(data.error || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Failed to save marketplace settings:', error)
      toast.error('An error occurred. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const calculateSellerPayout = (price: number) => {
    const fee = price * (feePercent / 100)
    return price - fee
  }

  return (
    <div className="space-y-6">
      {/* Revenue Info Banner */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
        <div className="flex items-start gap-3">
          <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-green-900">House Revenue from Marketplace</h3>
            <p className="text-sm text-green-700 mt-1">
              Your house earns <strong>{feePercent}%</strong> commission on every marketplace sale within all communities under this house.
              This is a great way to generate revenue for house activities, events, and operations.
            </p>
          </div>
        </div>
      </div>

      {/* Commission Settings */}
      <div className="border-b border-gray-200 pb-6">
        <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-gray-500" />
          Commission Settings
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              House Commission Percentage
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="30"
                step="0.5"
                value={feePercent}
                onChange={(e) => setFeePercent(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
              />
              <div className="flex items-center gap-2 min-w-[100px]">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="30"
                  value={feePercent}
                  onChange={(e) => setFeePercent(parseFloat(e.target.value))}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-green-500"
                />
                <span className="text-gray-600 font-medium">%</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Recommended: 5-10%. Higher fees may discourage sellers, lower fees generate less revenue.
            </p>
          </div>

          {/* Example Calculation */}
          <div className="bg-gray-50 rounded-lg p-4 mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Example Calculation</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Item price:</span>
                <span className="font-medium">$100.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">House commission ({feePercent}%):</span>
                <span className="text-red-600">-${(100 * feePercent / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="font-medium text-gray-900">Seller receives:</span>
                <span className="font-medium text-green-600">
                  ${calculateSellerPayout(100).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Approval Settings */}
      <div className="border-b border-gray-200 pb-6">
        <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-gray-500" />
          Product Approval
        </h3>
        
        <div className="space-y-3">
          <label className="flex items-center justify-between py-2 cursor-pointer">
            <div>
              <span className="text-sm font-medium text-gray-900">Auto-approve product listings</span>
              <p className="text-xs text-gray-500 mt-0.5">
                Automatically publish member product listings without moderation
              </p>
            </div>
            <input
              type="checkbox"
              checked={autoApprove}
              onChange={(e) => setAutoApprove(e.target.checked)}
              className="h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
            />
          </label>

          {!autoApprove && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-yellow-700">
                  When disabled, all product listings will require manual approval by a house admin 
                  before they appear in the marketplace. This allows you to review items for quality and appropriateness.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary Section */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">How it works</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Members can list items for sale in community marketplaces</li>
          <li>• Your house earns {feePercent}% commission on each successful sale</li>
          <li>• Sellers receive the remaining {100 - feePercent}% automatically</li>
          <li>• {autoApprove ? 'Products are published instantly' : 'Products require admin approval before going live'}</li>
          <li>• All transactions are tracked and reported in the house dashboard</li>
        </ul>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Marketplace Settings
            </>
          )}
        </button>
      </div>
    </div>
  )
}