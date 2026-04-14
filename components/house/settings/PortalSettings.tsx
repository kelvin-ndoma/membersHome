// components/house/settings/PortalSettings.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Save, Globe, MessageCircle, Users, Calendar, Lock } from 'lucide-react'

const portalSchema = z.object({
  welcomeMessage: z.string().optional(),
  requireMFAForPortal: z.boolean().default(false),
  sessionTimeout: z.number().min(5).max(480).default(480),
  enableDirectory: z.boolean().default(true),
  enableMessaging: z.boolean().default(true),
  enableEvents: z.boolean().default(true),
  primaryColor: z.string().default('#3B82F6'),
  secondaryColor: z.string().default('#1E40AF'),
})

type PortalForm = z.infer<typeof portalSchema>

interface PortalSettingsProps {
  orgSlug: string
  houseSlug: string
  houseId: string
  portal: any
}

export default function PortalSettings({ orgSlug, houseSlug, houseId, portal }: PortalSettingsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<PortalForm>({
    resolver: zodResolver(portalSchema),
    defaultValues: {
      welcomeMessage: portal?.welcomeMessage || '',
      requireMFAForPortal: portal?.requireMFAForPortal || false,
      sessionTimeout: portal?.sessionTimeout || 480,
      enableDirectory: portal?.features?.enableDirectory ?? true,
      enableMessaging: portal?.features?.enableMessaging ?? true,
      enableEvents: portal?.features?.enableEvents ?? true,
      primaryColor: portal?.theme?.primaryColor || '#3B82F6',
      secondaryColor: portal?.theme?.secondaryColor || '#1E40AF',
    }
  })

  const primaryColor = watch('primaryColor')
  const secondaryColor = watch('secondaryColor')

  const onSubmit = async (data: PortalForm) => {
    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/org/${orgSlug}/houses/${houseSlug}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portalUpdates: {
            welcomeMessage: data.welcomeMessage,
            requireMFAForPortal: data.requireMFAForPortal,
            sessionTimeout: data.sessionTimeout,
            theme: {
              primaryColor: data.primaryColor,
              secondaryColor: data.secondaryColor,
            },
            features: {
              enableDirectory: data.enableDirectory,
              enableMessaging: data.enableMessaging,
              enableEvents: data.enableEvents,
            }
          }
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Failed to update portal settings')
        return
      }

      toast.success('Portal settings updated successfully')
      router.refresh()
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Welcome Message */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Welcome Message
        </label>
        <textarea
          {...register('welcomeMessage')}
          rows={3}
          className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Welcome to our community! We're excited to have you here..."
        />
        <p className="mt-1 text-xs text-gray-500">
          Displayed on the member portal dashboard
        </p>
      </div>

      {/* Feature Toggles */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Enabled Features</h3>
        
        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <span className="font-medium text-gray-900">Member Directory</span>
                <p className="text-xs text-gray-500">Members can view and search other members</p>
              </div>
            </div>
            <input
              {...register('enableDirectory')}
              type="checkbox"
              className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <MessageCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <span className="font-medium text-gray-900">Member Messaging</span>
                <p className="text-xs text-gray-500">Members can send messages to each other</p>
              </div>
            </div>
            <input
              {...register('enableMessaging')}
              type="checkbox"
              className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <span className="font-medium text-gray-900">Events Access</span>
                <p className="text-xs text-gray-500">Members can view and RSVP to events</p>
              </div>
            </div>
            <input
              {...register('enableEvents')}
              type="checkbox"
              className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
            />
          </label>
        </div>
      </div>

      {/* Theme Colors */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Portal Theme</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Primary Color
            </label>
            <div className="flex items-center gap-3">
              <input
                {...register('primaryColor')}
                type="color"
                className="h-10 w-10 rounded border border-gray-300 cursor-pointer"
              />
              <input
                {...register('primaryColor')}
                type="text"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Secondary Color
            </label>
            <div className="flex items-center gap-3">
              <input
                {...register('secondaryColor')}
                type="color"
                className="h-10 w-10 rounded border border-gray-300 cursor-pointer"
              />
              <input
                {...register('secondaryColor')}
                type="text"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="p-4 rounded-lg border" style={{ backgroundColor: primaryColor + '10', borderColor: primaryColor + '30' }}>
          <p className="text-xs text-gray-500 mb-2">Preview</p>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: primaryColor }} />
            <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: secondaryColor }} />
            <span className="text-sm" style={{ color: primaryColor }}>Primary Text</span>
            <span className="text-sm" style={{ color: secondaryColor }}>Secondary Text</span>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Security</h3>
        
        <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Lock className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <span className="font-medium text-gray-900">Require MFA for Portal</span>
              <p className="text-xs text-gray-500">Members must use two-factor authentication</p>
            </div>
          </div>
          <input
            {...register('requireMFAForPortal')}
            type="checkbox"
            className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
          />
        </label>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Session Timeout (minutes)
          </label>
          <select
            {...register('sessionTimeout', { valueAsNumber: true })}
            className="block w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
            <option value={120}>2 hours</option>
            <option value={240}>4 hours</option>
            <option value={480}>8 hours</option>
          </select>
        </div>
      </div>

      {isDirty && (
        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </form>
  )
}