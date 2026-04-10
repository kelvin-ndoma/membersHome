// app/org/[orgSlug]/houses/[houseSlug]/tickets/create/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { 
  ArrowLeft, 
  Ticket, 
  DollarSign, 
  Users, 
  Calendar,
  Lock,
  Clock,
} from 'lucide-react'

const ticketSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  type: z.enum(['GENERAL_ADMISSION', 'VIP', 'EARLY_BIRD', 'GROUP', 'SEASON_PASS', 'WORKSHOP', 'COURSE', 'DONATION', 'CUSTOM']).default('GENERAL_ADMISSION'),
  price: z.number().min(0, 'Price must be 0 or greater'),
  currency: z.string().default('USD'),
  totalQuantity: z.number().min(1, 'Quantity must be at least 1'),
  maxPerPurchase: z.number().min(1).default(10),
  memberOnly: z.boolean().default(false),
  requiresApproval: z.boolean().default(false),
  salesStartAt: z.string().min(1, 'Sales start date is required'),
  salesEndAt: z.string().optional(),
  validFrom: z.string().min(1, 'Valid from date is required'),
  validUntil: z.string().optional(),
  eventId: z.string().min(1, 'Event is required'),
  status: z.enum(['DRAFT', 'ACTIVE']).default('DRAFT'),
})

type TicketForm = z.infer<typeof ticketSchema>

interface CreateTicketPageProps {
  params: {
    orgSlug: string
    houseSlug: string
  }
}

export default function CreateTicketPage({ params }: CreateTicketPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [events, setEvents] = useState<any[]>([])
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  
  const eventIdFromUrl = searchParams.get('eventId')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TicketForm>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      type: 'GENERAL_ADMISSION',
      currency: 'USD',
      maxPerPurchase: 10,
      memberOnly: false,
      requiresApproval: false,
      status: 'DRAFT',
      eventId: eventIdFromUrl || '',
    }
  })

  const selectedEventId = watch('eventId')
  const salesStartAt = watch('salesStartAt')

  // Auto-set validFrom when salesStartAt changes
  useEffect(() => {
    if (salesStartAt) {
      setValue('validFrom', salesStartAt)
    }
  }, [salesStartAt, setValue])

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(`/api/org/${params.orgSlug}/houses/${params.houseSlug}/events`)
        const data = await response.json()
        setEvents(data.events || [])
        
        if (eventIdFromUrl) {
          const event = data.events?.find((e: any) => e.id === eventIdFromUrl)
          if (event) {
            setSelectedEvent(event)
          }
        }
      } catch (error) {
        console.error('Failed to fetch events:', error)
      }
    }
    fetchEvents()
  }, [params.orgSlug, params.houseSlug, eventIdFromUrl])

  useEffect(() => {
    if (selectedEventId) {
      const event = events.find(e => e.id === selectedEventId)
      setSelectedEvent(event)
    } else {
      setSelectedEvent(null)
    }
  }, [selectedEventId, events])

  const onSubmit = async (data: TicketForm) => {
    if (!data.eventId) {
      toast.error('Please select an event')
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/org/${params.orgSlug}/houses/${params.houseSlug}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Failed to create ticket')
        return
      }

      toast.success('Ticket created successfully!')
      router.push(`/org/${params.orgSlug}/houses/${params.houseSlug}/tickets?eventId=${data.eventId}`)
      router.refresh()
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  if (events.length === 0 && !isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link 
            href={`/org/${params.orgSlug}/houses/${params.houseSlug}/tickets`}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tickets
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events available</h3>
          <p className="text-gray-500 mb-4">You need to create an event before you can create tickets.</p>
          <Link
            href={`/org/${params.orgSlug}/houses/${params.houseSlug}/events/create`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
          >
            <Calendar className="h-4 w-4" />
            Create Event First
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link 
          href={`/org/${params.orgSlug}/houses/${params.houseSlug}/tickets`}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tickets
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create Ticket</h1>
          <p className="text-sm text-gray-500 mt-1">
            Tickets must be associated with an event
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Event Selection - REQUIRED */}
          <div className="bg-purple-50 rounded-xl border border-purple-200 p-5">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Select Event <span className="text-red-500">*</span>
            </label>
            <select
              {...register('eventId')}
              className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              required
            >
              <option value="">Select an event...</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title} - {new Date(event.startDate).toLocaleDateString()}
                </option>
              ))}
            </select>
            {errors.eventId && (
              <p className="mt-1 text-sm text-red-600">{errors.eventId.message}</p>
            )}
            
            {selectedEvent && (
              <div className="mt-4 p-3 bg-white rounded-lg">
                <p className="text-sm font-medium text-gray-900">{selectedEvent.title}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(selectedEvent.startDate).toLocaleString()} • {selectedEvent.location || 'Online'}
                </p>
              </div>
            )}
          </div>

          {selectedEvent && (
            <>
              {/* Basic Info */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Ticket Details</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Ticket Name *
                    </label>
                    <div className="relative">
                      <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        {...register('name')}
                        type="text"
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="General Admission"
                      />
                    </div>
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Ticket Type *
                    </label>
                    <select
                      {...register('type')}
                      className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="GENERAL_ADMISSION">General Admission</option>
                      <option value="VIP">VIP</option>
                      <option value="EARLY_BIRD">Early Bird</option>
                      <option value="GROUP">Group</option>
                      <option value="SEASON_PASS">Season Pass</option>
                      <option value="WORKSHOP">Workshop</option>
                      <option value="COURSE">Course</option>
                      <option value="DONATION">Donation</option>
                      <option value="CUSTOM">Custom</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Description
                    </label>
                    <textarea
                      {...register('description')}
                      rows={3}
                      className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Describe what this ticket includes..."
                    />
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Pricing & Quantity</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Price *
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        {...register('price', { valueAsNumber: true })}
                        type="number"
                        step="0.01"
                        min="0"
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="0.00"
                      />
                    </div>
                    {errors.price && (
                      <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Currency
                    </label>
                    <select
                      {...register('currency')}
                      className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Total Quantity *
                    </label>
                    <div className="relative">
                      <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        {...register('totalQuantity', { valueAsNumber: true })}
                        type="number"
                        min="1"
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="100"
                      />
                    </div>
                    {errors.totalQuantity && (
                      <p className="mt-1 text-sm text-red-600">{errors.totalQuantity.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Max Per Purchase
                    </label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        {...register('maxPerPurchase', { valueAsNumber: true })}
                        type="number"
                        min="1"
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="10"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sales Period */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Sales Period</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Sales Start *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        {...register('salesStartAt')}
                        type="datetime-local"
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    {errors.salesStartAt && (
                      <p className="mt-1 text-sm text-red-600">{errors.salesStartAt.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Sales End (Optional)
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        {...register('salesEndAt')}
                        type="datetime-local"
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Ticket Validity Period */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Ticket Validity</h2>
                <p className="text-sm text-gray-500">When can this ticket be used?</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Valid From *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        {...register('validFrom')}
                        type="datetime-local"
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Defaults to sales start date
                    </p>
                    {errors.validFrom && (
                      <p className="mt-1 text-sm text-red-600">{errors.validFrom.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Valid Until (Optional)
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        {...register('validUntil')}
                        type="datetime-local"
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Leave empty for no expiration
                    </p>
                  </div>
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      {...register('memberOnly')}
                      type="checkbox"
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Members Only</span>
                      <p className="text-xs text-gray-500">Only house members can purchase this ticket</p>
                    </div>
                    <Lock className="h-4 w-4 text-gray-400 ml-auto" />
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      {...register('requiresApproval')}
                      type="checkbox"
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Requires Approval</span>
                      <p className="text-xs text-gray-500">Purchases need admin approval</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Status */}
              <div className="pt-4 border-t border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Status *
                </label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2">
                    <input
                      {...register('status')}
                      type="radio"
                      value="DRAFT"
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">Save as Draft</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      {...register('status')}
                      type="radio"
                      value="ACTIVE"
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">Publish Now</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <Link
                  href={`/org/${params.orgSlug}/houses/${params.houseSlug}/tickets`}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Creating...' : 'Create Ticket'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}