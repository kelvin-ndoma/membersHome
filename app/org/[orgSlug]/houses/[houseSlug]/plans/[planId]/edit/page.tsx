// app/org/[orgSlug]/houses/[houseSlug]/plans/[planId]/edit/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { 
  ArrowLeft, 
  Package, 
  DollarSign, 
  Plus,
  Trash2,
  CheckCircle,
  Globe,
  Lock,
  Save,
} from 'lucide-react'

const priceSchema = z.object({
  id: z.string().optional(),
  billingFrequency: z.enum(['MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL']),
  amount: z.number().min(0, 'Price must be 0 or greater'),
  currency: z.string().default('USD'),
  setupFee: z.number().min(0).default(0),
})

const planSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  type: z.enum(['STANDARD', 'PREMIUM', 'VIP', 'CUSTOM']).default('STANDARD'),
  features: z.array(z.string()).default([]),
  isPublic: z.boolean().default(true),
  requiresApproval: z.boolean().default(false),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).default('ACTIVE'),
  prices: z.array(priceSchema).min(1, 'At least one price option is required'),
})

type PlanForm = z.infer<typeof planSchema>

interface EditPlanPageProps {
  params: {
    orgSlug: string
    houseSlug: string
    planId: string
  }
}

export default function EditPlanPage({ params }: EditPlanPageProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPlan, setIsLoadingPlan] = useState(true)
  const [newFeature, setNewFeature] = useState('')
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<PlanForm>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      type: 'STANDARD',
      isPublic: true,
      requiresApproval: false,
      status: 'ACTIVE',
      features: [],
      prices: [],
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'prices',
  })

  const features = watch('features') || []

  // Fetch plan data
  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const response = await fetch(`/api/org/${params.orgSlug}/houses/${params.houseSlug}/plans/${params.planId}`)
        const data = await response.json()
        
        if (!response.ok) {
          toast.error('Failed to load plan')
          router.push(`/org/${params.orgSlug}/houses/${params.houseSlug}/plans`)
          return
        }

        const plan = data.plan
        
        reset({
          name: plan.name,
          description: plan.description || '',
          type: plan.type,
          features: (plan.features as string[]) || [],
          isPublic: plan.isPublic,
          requiresApproval: plan.requiresApproval,
          status: plan.status,
          prices: plan.prices.map((p: any) => ({
            id: p.id,
            billingFrequency: p.billingFrequency,
            amount: p.amount,
            currency: p.currency,
            setupFee: p.setupFee || 0,
          })),
        })
      } catch (error) {
        toast.error('Failed to load plan')
        router.push(`/org/${params.orgSlug}/houses/${params.houseSlug}/plans`)
      } finally {
        setIsLoadingPlan(false)
      }
    }

    fetchPlan()
  }, [params, reset, router])

  const addFeature = () => {
    if (newFeature.trim()) {
      setValue('features', [...features, newFeature.trim()])
      setNewFeature('')
    }
  }

  const removeFeature = (index: number) => {
    setValue('features', features.filter((_, i) => i !== index))
  }

  const addPrice = () => {
    append({
      billingFrequency: 'MONTHLY',
      amount: 0,
      currency: 'USD',
      setupFee: 0,
    })
  }

  const onSubmit = async (data: PlanForm) => {
    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/org/${params.orgSlug}/houses/${params.houseSlug}/plans/${params.planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Failed to update plan')
        return
      }

      toast.success('Membership plan updated successfully!')
      router.push(`/org/${params.orgSlug}/houses/${params.houseSlug}/plans/${params.planId}`)
      router.refresh()
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const billingFrequencyLabels = {
    MONTHLY: 'Monthly',
    QUARTERLY: 'Quarterly',
    SEMI_ANNUAL: 'Semi-Annual',
    ANNUAL: 'Annual',
  }

  if (isLoadingPlan) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link 
          href={`/org/${params.orgSlug}/houses/${params.houseSlug}/plans/${params.planId}`}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Plan
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Edit Membership Plan</h1>
          <p className="text-sm text-gray-500 mt-1">
            Update your membership plan details
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Plan Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Plan Name *
                </label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    {...register('name')}
                    type="text"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Premium Membership"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Plan Type *
                </label>
                <select
                  {...register('type')}
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="STANDARD">Standard</option>
                  <option value="PREMIUM">Premium</option>
                  <option value="VIP">VIP</option>
                  <option value="CUSTOM">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Status *
                </label>
                <select
                  {...register('status')}
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe what this plan includes..."
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Pricing Options *</h2>
              <button
                type="button"
                onClick={addPrice}
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add Price Option
              </button>
            </div>

            {errors.prices && (
              <p className="text-sm text-red-600">{errors.prices.message}</p>
            )}

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Option {index + 1}</span>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-xs text-gray-500 mb-1">Frequency</label>
                      <select
                        {...register(`prices.${index}.billingFrequency`)}
                        className="block w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
                      >
                        {Object.entries(billingFrequencyLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Amount</label>
                      <div className="relative">
                        <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                        <input
                          {...register(`prices.${index}.amount`, { valueAsNumber: true })}
                          type="number"
                          step="0.01"
                          min="0"
                          className="block w-full pl-6 pr-2 py-1.5 text-sm border border-gray-300 rounded-lg"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Currency</label>
                      <select
                        {...register(`prices.${index}.currency`)}
                        className="block w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Setup Fee</label>
                      <div className="relative">
                        <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                        <input
                          {...register(`prices.${index}.setupFee`, { valueAsNumber: true })}
                          type="number"
                          step="0.01"
                          min="0"
                          className="block w-full pl-6 pr-2 py-1.5 text-sm border border-gray-300 rounded-lg"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Hidden ID field for existing prices */}
                  {field.id && (
                    <input type="hidden" {...register(`prices.${index}.id`)} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Features</h2>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add a feature (e.g., '24/7 Support')"
              />
              <button
                type="button"
                onClick={addFeature}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Add
              </button>
            </div>

            {features.length > 0 && (
              <ul className="space-y-2">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Settings */}
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
            
            <label className="flex items-center gap-3">
              <input
                {...register('isPublic')}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">Public Plan</span>
                <p className="text-xs text-gray-500">Visible on public membership page</p>
              </div>
              <Globe className="h-4 w-4 text-gray-400 ml-auto" />
            </label>

            <label className="flex items-center gap-3">
              <input
                {...register('requiresApproval')}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">Requires Approval</span>
                <p className="text-xs text-gray-500">Applications need admin approval</p>
              </div>
              <Lock className="h-4 w-4 text-gray-400 ml-auto" />
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <Link
              href={`/org/${params.orgSlug}/houses/${params.houseSlug}/plans/${params.planId}`}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}