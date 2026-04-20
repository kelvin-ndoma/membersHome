// app/(platform)/platform/settings/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { 
  Save, 
  Palette, 
  Globe, 
  Shield,
  Building2,
  CreditCard,
  Eye,
} from 'lucide-react'
import ImageUpload from '@/components/ui/ImageUpload'

const platformSettingsSchema = z.object({
  name: z.string().min(2, 'Platform name must be at least 2 characters'),
  description: z.string().optional(),
  logoUrl: z.string().optional(),
  faviconUrl: z.string().optional(),
  loginPageImage: z.string().optional(),
  primaryColor: z.string().default('#3B82F6'),
  secondaryColor: z.string().default('#1E40AF'),
  accentColor: z.string().default('#10B981'),
  backgroundColor: z.string().default('#F9FAFB'),
  textColor: z.string().default('#111827'),
  borderRadius: z.string().default('0.5rem'),
  buttonStyle: z.string().default('rounded'),
  fontFamily: z.string().default('Inter'),
  customCSS: z.string().optional(),
  allowCustomDomains: z.boolean().default(true),
  allowOrgCustomization: z.boolean().default(true),
  maxOrganizations: z.number().optional(),
  defaultPlanForNewOrgs: z.enum(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE']).default('FREE'),
  enableMultiTenancy: z.boolean().default(true),
  enableMemberMessaging: z.boolean().default(true),
  enableMemberDirectory: z.boolean().default(true),
  platformFeePercent: z.number().min(0).max(100).default(0),
  stripePlatformAccountId: z.string().optional(),
})

type PlatformSettingsForm = z.infer<typeof platformSettingsSchema>

export default function PlatformSettingsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('branding')
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<PlatformSettingsForm>({
    resolver: zodResolver(platformSettingsSchema),
    defaultValues: {
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      accentColor: '#10B981',
      backgroundColor: '#F9FAFB',
      textColor: '#111827',
      borderRadius: '0.5rem',
      buttonStyle: 'rounded',
      fontFamily: 'Inter',
      allowCustomDomains: true,
      allowOrgCustomization: true,
      defaultPlanForNewOrgs: 'FREE',
      enableMultiTenancy: true,
      enableMemberMessaging: true,
      enableMemberDirectory: true,
      platformFeePercent: 0,
    }
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/platform/settings')
      const data = await response.json()
      console.log('Fetched settings:', data.platform) // Debug log
      
      if (data.platform) {
        reset({
          name: data.platform.name || 'MembersHome',
          description: data.platform.description || '',
          logoUrl: data.platform.logoUrl || '',
          faviconUrl: data.platform.faviconUrl || '',
          loginPageImage: data.platform.loginPageImage || '',
          primaryColor: data.platform.primaryColor || '#3B82F6',
          secondaryColor: data.platform.secondaryColor || '#1E40AF',
          accentColor: data.platform.accentColor || '#10B981',
          backgroundColor: data.platform.backgroundColor || '#F9FAFB',
          textColor: data.platform.textColor || '#111827',
          borderRadius: data.platform.borderRadius || '0.5rem',
          buttonStyle: data.platform.buttonStyle || 'rounded',
          fontFamily: data.platform.fontFamily || 'Inter',
          customCSS: data.platform.customCSS || '',
          allowCustomDomains: data.platform.allowCustomDomains ?? true,
          allowOrgCustomization: data.platform.allowOrgCustomization ?? true,
          maxOrganizations: data.platform.maxOrganizations || undefined,
          defaultPlanForNewOrgs: data.platform.defaultPlanForNewOrgs || 'FREE',
          enableMultiTenancy: data.platform.enableMultiTenancy ?? true,
          enableMemberMessaging: data.platform.enableMemberMessaging ?? true,
          enableMemberDirectory: data.platform.enableMemberDirectory ?? true,
          platformFeePercent: data.platform.platformFeePercent || 0,
          stripePlatformAccountId: data.platform.stripePlatformAccountId || '',
        })
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setIsInitialLoading(false)
    }
  }

  const onSubmit = async (data: PlatformSettingsForm) => {
    console.log('Submitting data:', data) // Debug log
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/platform/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      const result = await response.json()
      console.log('API response:', result) // Debug log
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update settings')
      }
      
      toast.success('Platform settings updated successfully')
      reset(data) // Reset form dirty state
    } catch (error) {
      console.error('Submit error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update settings')
    } finally {
      setIsLoading(false)
    }
  }

  const primaryColor = watch('primaryColor')
  const secondaryColor = watch('secondaryColor')
  const accentColor = watch('accentColor')
  const backgroundColor = watch('backgroundColor')
  const textColor = watch('textColor')
  const buttonStyle = watch('buttonStyle')

  const tabs = [
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'features', label: 'Features', icon: Globe },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'advanced', label: 'Advanced', icon: Shield },
  ]

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage global platform configuration and branding
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="inline h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Branding Tab */}
        {activeTab === 'branding' && (
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
                  <p className="text-sm text-gray-500">Platform identity and description</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Platform Name
                  </label>
                  <input
                    {...register('name')}
                    type="text"
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="MembersHome"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Description
                  </label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Complete membership management platform..."
                  />
                </div>
              </div>
            </div>

            {/* Theme Colors */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <Palette className="h-5 w-5 text-pink-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Theme Colors</h2>
                  <p className="text-sm text-gray-500">Customize the platform appearance</p>
                </div>
              </div>
              
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
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono"
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
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Accent Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      {...register('accentColor')}
                      type="color"
                      className="h-10 w-10 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      {...register('accentColor')}
                      type="text"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Background Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      {...register('backgroundColor')}
                      type="color"
                      className="h-10 w-10 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      {...register('backgroundColor')}
                      type="text"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Text Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      {...register('textColor')}
                      type="color"
                      className="h-10 w-10 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      {...register('textColor')}
                      type="text"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Live Preview */}
              <div className="mt-6 p-4 rounded-lg border" style={{ backgroundColor: backgroundColor + '40' }}>
                <p className="text-sm font-medium mb-3" style={{ color: textColor }}>Live Preview</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded" style={{ backgroundColor: primaryColor }} />
                    <div className="w-8 h-8 rounded" style={{ backgroundColor: secondaryColor }} />
                    <div className="w-8 h-8 rounded" style={{ backgroundColor: accentColor }} />
                    <span style={{ color: textColor }}>Text Color</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={`px-4 py-2 text-white font-medium ${
                        buttonStyle === 'rounded' ? 'rounded-lg' : 
                        buttonStyle === 'pill' ? 'rounded-full' : ''
                      }`}
                      style={{ backgroundColor: primaryColor }}
                    >
                      Primary
                    </button>
                    <button
                      type="button"
                      className={`px-4 py-2 text-white font-medium ${
                        buttonStyle === 'rounded' ? 'rounded-lg' : 
                        buttonStyle === 'pill' ? 'rounded-full' : ''
                      }`}
                      style={{ backgroundColor: secondaryColor }}
                    >
                      Secondary
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save Button - Fixed at bottom */}
        <div className="fixed bottom-6 right-6 z-50">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg shadow-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}