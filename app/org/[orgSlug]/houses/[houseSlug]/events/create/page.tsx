// app/org/[orgSlug]/houses/[houseSlug]/events/create/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Globe, 
  Users, 
  Lock,
  Settings2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import ImageUpload from '@/components/ui/ImageUpload'

const eventSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  timezone: z.string().default('UTC'),
  location: z.string().optional(),
  address: z.string().optional(),
  onlineUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  type: z.enum(['IN_PERSON', 'ONLINE', 'HYBRID']).default('IN_PERSON'),
  isFree: z.boolean().default(true),
  capacity: z.number().optional(),
  price: z.number().min(0).default(0),
  currency: z.string().default('USD'),
  memberOnly: z.boolean().default(false),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
  
  // Structured settings
  settings: z.object({
    rsvp: z.object({
      enabled: z.boolean().default(true),
      deadline: z.string().optional(),
      maxGuestsPerRsvp: z.number().min(1).default(2),
      requireApproval: z.boolean().default(false),
    }),
    tickets: z.object({
      maxPerPurchase: z.number().min(1).default(5),
      allowPurchases: z.boolean().default(true),
    }),
  }),
})

type EventForm = z.infer<typeof eventSchema>

interface CreateEventPageProps {
  params: {
    orgSlug: string
    houseSlug: string
  }
}

export default function CreateEventPage({ params }: CreateEventPageProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EventForm>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      type: 'IN_PERSON',
      isFree: true,
      memberOnly: false,
      status: 'DRAFT',
      currency: 'USD',
      timezone: 'UTC',
      settings: {
        rsvp: {
          enabled: true,
          maxGuestsPerRsvp: 2,
          requireApproval: false,
          deadline: '',
        },
        tickets: {
          maxPerPurchase: 5,
          allowPurchases: true,
        },
      },
    },
  })

  const title = watch('title')
  const eventType = watch('type')
  const isFree = watch('isFree')
  const startDate = watch('startDate')
  const endDate = watch('endDate')
  const rsvpEnabled = watch('settings.rsvp.enabled')
  const allowTicketPurchases = watch('settings.tickets.allowPurchases')

  const generateSlug = () => {
    if (title) {
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      setValue('slug', slug)
    }
  }

  // Auto-set end date to start date + 2 hours if not set
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const startValue = e.target.value
    setValue('startDate', startValue)
    
    const currentEndDate = watch('endDate')
    if (!currentEndDate || new Date(currentEndDate) <= new Date(startValue)) {
      const startDateTime = new Date(startValue)
      startDateTime.setHours(startDateTime.getHours() + 2)
      const endValue = startDateTime.toISOString().slice(0, 16)
      setValue('endDate', endValue)
    }
  }

  const onSubmit = async (data: EventForm) => {
    // Validate end date is after start date
    if (new Date(data.endDate) <= new Date(data.startDate)) {
      toast.error('End date must be after start date')
      return
    }

    // Validate RSVP deadline is before start date if set
    if (data.settings?.rsvp?.deadline) {
      if (new Date(data.settings.rsvp.deadline) >= new Date(data.startDate)) {
        toast.error('RSVP deadline must be before the event starts')
        return
      }
    }

    setIsLoading(true)
    
    try {
      // Clean up the data before sending
      const submitData = {
        ...data,
        // Remove empty deadline strings
        settings: {
          ...data.settings,
          rsvp: {
            ...data.settings.rsvp,
            deadline: data.settings.rsvp.deadline || undefined,
          },
        },
      }

      const response = await fetch(`/api/org/${params.orgSlug}/houses/${params.houseSlug}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Failed to create event')
        return
      }

      toast.success('Event created successfully!')
      router.push(`/org/${params.orgSlug}/houses/${params.houseSlug}/events`)
      router.refresh()
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link 
          href={`/org/${params.orgSlug}/houses/${params.houseSlug}/events`}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Events
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create Event</h1>
          <p className="text-sm text-gray-500 mt-1">
            Add a new event to your house
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Image (Optional)
            </label>
            <ImageUpload
              value={watch('imageUrl')}
              onChange={(url) => setValue('imageUrl', url, { shouldDirty: true })}
              folder="events"
            />
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Event Title *
              </label>
              <input
                {...register('title')}
                type="text"
                onChange={(e) => {
                  register('title').onChange(e)
                  generateSlug()
                }}
                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Summer Mixer 2026"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Slug *
              </label>
              <input
                {...register('slug')}
                type="text"
                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="summer-mixer-2026"
              />
              {errors.slug && (
                <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Tell attendees what this event is about..."
              />
            </div>
          </div>

          {/* Date & Time */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Date & Time</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Start Date & Time *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    {...register('startDate')}
                    type="datetime-local"
                    onChange={handleStartDateChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                {errors.startDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  End Date & Time *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    {...register('endDate')}
                    type="datetime-local"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                {errors.endDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
                )}
              </div>
            </div>

            {/* Date Range Display */}
            {startDate && endDate && (
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Event Duration:</strong>{' '}
                  {new Date(startDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                  {' at '}
                  {new Date(startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {' - '}
                  {new Date(endDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                  {' at '}
                  {new Date(endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )}
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Location</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Type *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    {...register('type')}
                    type="radio"
                    value="IN_PERSON"
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">In Person</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    {...register('type')}
                    type="radio"
                    value="ONLINE"
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Online</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    {...register('type')}
                    type="radio"
                    value="HYBRID"
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Hybrid</span>
                </label>
              </div>
            </div>

            {(eventType === 'IN_PERSON' || eventType === 'HYBRID') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Location Name
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      {...register('location')}
                      type="text"
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Venue name"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Address
                  </label>
                  <textarea
                    {...register('address')}
                    rows={2}
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Full address"
                  />
                </div>
              </>
            )}

            {(eventType === 'ONLINE' || eventType === 'HYBRID') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Online Meeting URL
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    {...register('onlineUrl')}
                    type="url"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://zoom.us/j/..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Pricing & Capacity */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Pricing & Capacity</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 mb-3">
                  <input
                    {...register('isFree')}
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">This is a free event</span>
                </label>

                {!isFree && (
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Price</label>
                      <input
                        {...register('price', { valueAsNumber: true })}
                        type="number"
                        step="0.01"
                        min="0"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-xs text-gray-500 mb-1">Currency</label>
                      <select
                        {...register('currency')}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Capacity (Optional)
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    {...register('capacity', { valueAsNumber: true })}
                    type="number"
                    min="1"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Unlimited"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="space-y-4 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <Settings2 className="h-4 w-4" />
              Advanced Settings
              {showAdvanced ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {showAdvanced && (
              <div className="space-y-6 bg-gray-50 rounded-lg p-4">
                {/* RSVP Settings */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">RSVP Settings</h4>
                  
                  <label className="flex items-center gap-2">
                    <input
                      {...register('settings.rsvp.enabled')}
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Enable RSVP for this event</span>
                  </label>

                  {rsvpEnabled && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          RSVP Deadline (Optional)
                        </label>
                        <input
                          {...register('settings.rsvp.deadline')}
                          type="datetime-local"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          After this date, members cannot RSVP
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Max Guests per RSVP
                        </label>
                        <input
                          {...register('settings.rsvp.maxGuestsPerRsvp', { valueAsNumber: true })}
                          type="number"
                          min="1"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <label className="flex items-center gap-2">
                        <input
                          {...register('settings.rsvp.requireApproval')}
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">Require approval for RSVPs</span>
                      </label>
                    </>
                  )}
                </div>

                {/* Ticket Settings */}
                <div className="space-y-3 pt-3 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900">Ticket Purchase Limits</h4>
                  
                  <label className="flex items-center gap-2">
                    <input
                      {...register('settings.tickets.allowPurchases')}
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Allow ticket purchases</span>
                  </label>

                  {allowTicketPurchases && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Max Tickets per Purchase
                      </label>
                      <input
                        {...register('settings.tickets.maxPerPurchase', { valueAsNumber: true })}
                        type="number"
                        min="1"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Maximum number of tickets a single person can purchase
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Member Only Setting */}
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                {...register('memberOnly')}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Members only event</span>
              <Lock className="h-4 w-4 text-gray-400" />
            </label>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  {...register('status')}
                  type="radio"
                  value="DRAFT"
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Save as Draft</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  {...register('status')}
                  type="radio"
                  value="PUBLISHED"
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Publish Now</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <Link
              href={`/org/${params.orgSlug}/houses/${params.houseSlug}/events`}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}