// app/apply/[orgSlug]/[houseSlug]/form/page.tsx
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Briefcase,
  CheckCircle,
  Loader2,
} from 'lucide-react'

const applicationSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  gender: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  howDidYouHear: z.string().optional(),
  contribution: z.string().optional(),
  hobbies: z.string().optional(),
  membershipPlanId: z.string().min(1, 'Please select a plan'),
  selectedPriceId: z.string().min(1, 'Please select a billing frequency'),
})

type ApplicationForm = z.infer<typeof applicationSchema>

interface FormPageProps {
  params: {
    orgSlug: string
    houseSlug: string
  }
}

function ApplicationFormContent({ params }: FormPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [house, setHouse] = useState<any>(null)
  const [plans, setPlans] = useState<any[]>([])
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)
  
  const planIdFromUrl = searchParams.get('plan')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ApplicationForm>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      membershipPlanId: planIdFromUrl || '',
    }
  })

  const selectedPlanId = watch('membershipPlanId')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/public/houses/${params.houseSlug}/plans?orgSlug=${params.orgSlug}`)
        const data = await response.json()
        
        if (!response.ok) {
          console.error('Failed to load plans:', data.error)
          toast.error('Failed to load membership plans')
          return
        }
        
        setHouse(data.house)
        setPlans(data.plans || [])
        
        if (planIdFromUrl) {
          const plan = data.plans?.find((p: any) => p.id === planIdFromUrl)
          if (plan) {
            setSelectedPlan(plan)
            if (plan.prices?.length === 1) {
              setValue('selectedPriceId', plan.prices[0].id)
            }
          }
        }
      } catch (error) {
        console.error('Failed to load data:', error)
        toast.error('Failed to load data')
      } finally {
        setIsLoadingData(false)
      }
    }
    
    fetchData()
  }, [params.houseSlug, params.orgSlug, planIdFromUrl, setValue])

  useEffect(() => {
    if (selectedPlanId) {
      const plan = plans.find(p => p.id === selectedPlanId)
      setSelectedPlan(plan)
      if (plan?.prices?.length === 1) {
        setValue('selectedPriceId', plan.prices[0].id)
      }
    }
  }, [selectedPlanId, plans, setValue])

  const onSubmit = async (data: ApplicationForm) => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          orgSlug: params.orgSlug,
          houseSlug: params.houseSlug,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Failed to submit application')
        return
      }

      toast.success('Application submitted successfully!')
      router.push(`/apply/status/${result.applicationId}`)
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!house) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900">House not found</h2>
          <Link href="/discover" className="text-blue-600 hover:underline">
            Return to discover
          </Link>
        </div>
      </div>
    )
  }

  if (plans.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">No plans available</h2>
          <p className="text-gray-500 mb-4">This house doesn't have any membership plans available yet.</p>
          <Link href="/discover" className="text-blue-600 hover:underline">
            Return to discover
          </Link>
        </div>
      </div>
    )
  }

  const primaryColor = house.organization?.primaryColor || '#3B82F6'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link 
            href={`/apply/${params.orgSlug}/${params.houseSlug}`}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Plans
          </Link>
          
          <h1 className="text-2xl font-bold text-gray-900">Membership Application</h1>
          <p className="text-gray-600">{house.name} • {house.organization?.name}</p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Selected Plan Summary */}
          {selectedPlan && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Selected Plan</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{selectedPlan.name}</p>
                  <p className="text-sm text-gray-500">{selectedPlan.description}</p>
                </div>
                <div className="text-right">
                  {selectedPlan.prices?.length > 0 && (
                    <select
                      {...register('selectedPriceId')}
                      className="text-sm border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="">Select billing</option>
                      {selectedPlan.prices.map((price: any) => (
                        <option key={price.id} value={price.id}>
                          {price.billingFrequency.toLowerCase().replace('_', ' ')} - {price.currency} {price.amount}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
              {errors.selectedPriceId && (
                <p className="mt-2 text-sm text-red-600">{errors.selectedPriceId.message}</p>
              )}
            </div>
          )}

          {/* Personal Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  First Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    {...register('firstName')}
                    type="text"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="John"
                  />
                </div>
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Last Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    {...register('lastName')}
                    type="text"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Doe"
                  />
                </div>
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    {...register('email')}
                    type="email"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="john@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Phone Number (Optional)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    {...register('phone')}
                    type="tel"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Gender (Optional)
                </label>
                <select
                  {...register('gender')}
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Professional Information (Optional)</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Company
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    {...register('company')}
                    type="text"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg"
                    placeholder="Company name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Position
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    {...register('position')}
                    type="text"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg"
                    placeholder="Job title"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Additional Information (Optional)</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                How did you hear about us?
              </label>
              <select
                {...register('howDidYouHear')}
                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg"
              >
                <option value="">Select an option</option>
                <option value="social_media">Social Media</option>
                <option value="friend">Friend or Colleague</option>
                <option value="event">Event</option>
                <option value="search">Search Engine</option>
                <option value="advertisement">Advertisement</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                What would you like to contribute to the community?
              </label>
              <textarea
                {...register('contribution')}
                rows={2}
                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg"
                placeholder="Share your skills, interests, or how you'd like to get involved..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Hobbies & Interests
              </label>
              <textarea
                {...register('hobbies')}
                rows={2}
                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg"
                placeholder="Tell us about your hobbies and interests..."
              />
            </div>
          </div>

          {/* Submit */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start gap-3 mb-6">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600">
                By submitting this application, you agree to be contacted about your membership.
                Your information will be handled according to our privacy policy.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <Link
                href={`/apply/${params.orgSlug}/${params.houseSlug}`}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2.5 text-sm font-medium text-white rounded-lg disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  'Submit Application'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ApplicationFormPage({ params }: FormPageProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <ApplicationFormContent params={params} />
    </Suspense>
  )
}