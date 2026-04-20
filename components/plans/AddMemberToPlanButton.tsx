// components/plans/AddMemberToPlanButton.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { 
  UserPlus, 
  X, 
  Mail, 
  User, 
  Loader2,
  Building2,
} from 'lucide-react'

const addMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  priceId: z.string().min(1, 'Please select a billing frequency'),
  sendInvitation: z.boolean().default(true),
  chargeNow: z.boolean().default(true),
  initiationFeeWaived: z.boolean().default(false),
})

type AddMemberForm = z.infer<typeof addMemberSchema>

interface AddMemberToPlanButtonProps {
  plan: any
  houseSlug: string
  orgSlug: string
  isGroupPlan: boolean
  remainingSeats: number | null
  seatsIncluded?: number  // ADD THIS
  variant?: 'primary' | 'secondary'
}

export default function AddMemberToPlanButton({ 
  plan, 
  houseSlug, 
  orgSlug,
  isGroupPlan,
  remainingSeats,
  seatsIncluded = 1,  // ADD THIS with default
  variant = 'primary'
}: AddMemberToPlanButtonProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const settings = (plan.settings as any) || {}
  const initiationFee = settings.initiationFee || 0
  
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<AddMemberForm>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: {
      sendInvitation: true,
      chargeNow: true,
      initiationFeeWaived: false,
    }
  })

  const selectedPriceId = watch('priceId')
  const chargeNow = watch('chargeNow')
  
  const selectedPrice = plan.prices?.find((p: any) => p.id === selectedPriceId)

  const onSubmit = async (data: AddMemberForm) => {
    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/org/${orgSlug}/houses/${houseSlug}/members/add-to-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          planId: plan.id,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Failed to add member')
        return
      }

      toast.success('Member added successfully!')
      reset()
      setIsOpen(false)
      router.refresh()
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const buttonClass = variant === 'primary' 
    ? 'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700'
    : 'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100'

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={buttonClass}
      >
        <UserPlus className="h-4 w-4" />
        Add Member
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/30" onClick={() => setIsOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Add Member to {plan.name}
                </h3>
                {isGroupPlan && remainingSeats !== null && (
                  <p className="text-sm text-gray-500">
                    {remainingSeats} of {seatsIncluded} seat{seatsIncluded !== 1 ? 's' : ''} remaining
                  </p>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Member Details */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    {...register('name')}
                    type="text"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="John Doe"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    {...register('email')}
                    type="email"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="john@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* Billing Frequency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Billing Frequency *
                </label>
                <select
                  {...register('priceId')}
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select frequency</option>
                  {plan.prices?.map((price: any) => (
                    <option key={price.id} value={price.id}>
                      {price.billingFrequency.toLowerCase().replace('_', ' ')} - {price.currency} {price.amount.toFixed(2)}
                      {price.setupFee > 0 && ` (+${price.currency} ${price.setupFee} setup)`}
                    </option>
                  ))}
                </select>
                {errors.priceId && (
                  <p className="mt-1 text-sm text-red-600">{errors.priceId.message}</p>
                )}
              </div>

              {/* Pricing Summary */}
              {selectedPrice && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-900">Billing Summary</p>
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Base price:</span>
                      <span className="font-medium">
                        {selectedPrice.currency} {selectedPrice.amount.toFixed(2)} / {selectedPrice.billingFrequency.toLowerCase().replace('_', ' ')}
                      </span>
                    </div>
                    {selectedPrice.setupFee > 0 && !watch('initiationFeeWaived') && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Initiation fee:</span>
                        <span className="font-medium">
                          {selectedPrice.currency} {selectedPrice.setupFee.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {settings.serviceFee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Service fee:</span>
                        <span className="font-medium">{settings.serviceFee}%</span>
                      </div>
                    )}
                    <div className="border-t border-gray-200 pt-1 mt-1 flex justify-between">
                      <span className="font-medium text-gray-900">Total due now:</span>
                      <span className="font-medium text-gray-900">
                        {selectedPrice.currency} {(
                          selectedPrice.amount + 
                          (chargeNow && !watch('initiationFeeWaived') ? selectedPrice.setupFee : 0)
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Options */}
              <div className="space-y-3">
                {initiationFee > 0 && settings.initiationFeeWaivable && (
                  <label className="flex items-center gap-2">
                    <input
                      {...register('initiationFeeWaived')}
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Waive initiation fee</span>
                  </label>
                )}

                <label className="flex items-center gap-2">
                  <input
                    {...register('chargeNow')}
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Charge now</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    {...register('sendInvitation')}
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Send portal invitation</span>
                </label>
              </div>

              {isGroupPlan && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm text-amber-800">
                    <Building2 className="inline h-4 w-4 mr-1" />
                    This is a group plan. The member will occupy one of {seatsIncluded} seats.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                      Adding...
                    </>
                  ) : (
                    'Add Member'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}