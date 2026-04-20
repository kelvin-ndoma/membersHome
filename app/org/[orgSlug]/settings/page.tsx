// app/org/[orgSlug]/settings/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { 
  Save, 
  Building2, 
  Globe, 
  Mail,
  Palette,
  Shield,
  Users,
  CreditCard,
  Bell,
  Settings,
  Activity,
} from 'lucide-react'
import { ThemeButton } from '@/components/ui/ThemeButton'
import { ThemeCard } from '@/components/ui/ThemeCard'
import { ThemeInput } from '@/components/ui/ThemeInput'
import { ThemeBadge } from '@/components/ui/ThemeBadge'
import ImageUpload from '@/components/ui/ImageUpload'
import Link from 'next/link'

const generalSettingsSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  description: z.string().optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  billingEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
})

type GeneralSettingsForm = z.infer<typeof generalSettingsSchema>

const brandingSettingsSchema = z.object({
  logoUrl: z.string().optional(),
  faviconUrl: z.string().optional(),
  loginPageImage: z.string().optional(),
  primaryColor: z.string().min(1, 'Primary color is required').default('#0a387c'),
  secondaryColor: z.string().min(1, 'Secondary color is required').default('#0596eb'),
  accentColor: z.string().min(1, 'Accent color is required').default('#f59e0b'),
  backgroundColor: z.string().min(1, 'Background color is required').default('#f8fafc'),
  textColor: z.string().min(1, 'Text color is required').default('#0f172a'),
  borderRadius: z.string().default('0.5rem'),
  buttonStyle: z.string().default('rounded'),
  fontFamily: z.string().default('Inter'),
  customCSS: z.string().optional(),
  customDomain: z.string().optional(),
})

type BrandingSettingsForm = z.infer<typeof brandingSettingsSchema>

interface OrgSettingsPageProps {
  params: { orgSlug: string }
}

// Default colors for new organizations
const DEFAULT_ORG_COLORS = {
  primaryColor: '#0a387c',
  secondaryColor: '#0596eb',
  accentColor: '#f59e0b',
  backgroundColor: '#f8fafc',
  textColor: '#0f172a',
}

export default function OrgSettingsPage({ params }: OrgSettingsPageProps) {
  const [activeTab, setActiveTab] = useState('general')
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [organization, setOrganization] = useState<any>(null)
  
  const {
    register: registerGeneral,
    handleSubmit: handleSubmitGeneral,
    reset: resetGeneral,
    formState: { errors: errorsGeneral, isDirty: isGeneralDirty },
  } = useForm<GeneralSettingsForm>({
    resolver: zodResolver(generalSettingsSchema),
  })

  const {
    register: registerBranding,
    handleSubmit: handleSubmitBranding,
    watch: watchBranding,
    setValue: setBrandingValue,
    reset: resetBranding,
    formState: { isDirty: isBrandingDirty },
  } = useForm<BrandingSettingsForm>({
    resolver: zodResolver(brandingSettingsSchema),
    defaultValues: DEFAULT_ORG_COLORS,
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch(`/api/org/${params.orgSlug}/settings`)
      const data = await response.json()
      
      if (data.organization) {
        const org = data.organization
        setOrganization(org)
        
        resetGeneral({
          name: org.name || '',
          description: org.description || '',
          website: org.website || '',
          billingEmail: org.billingEmail || '',
        })
        
        // Use organization colors, fallback to defaults if not set
        resetBranding({
          logoUrl: org.logoUrl || '',
          faviconUrl: org.faviconUrl || '',
          loginPageImage: org.loginPageImage || '',
          primaryColor: org.primaryColor || DEFAULT_ORG_COLORS.primaryColor,
          secondaryColor: org.secondaryColor || DEFAULT_ORG_COLORS.secondaryColor,
          accentColor: org.accentColor || DEFAULT_ORG_COLORS.accentColor,
          backgroundColor: org.backgroundColor || DEFAULT_ORG_COLORS.backgroundColor,
          textColor: org.textColor || DEFAULT_ORG_COLORS.textColor,
          borderRadius: org.borderRadius || '0.5rem',
          buttonStyle: org.buttonStyle || 'rounded',
          fontFamily: org.fontFamily || 'Inter',
          customCSS: org.customCSS || '',
          customDomain: org.customDomain || '',
        })
      } else {
        // New organization - use defaults
        resetBranding(DEFAULT_ORG_COLORS)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setIsInitialLoading(false)
    }
  }

  const onGeneralSubmit = async (data: GeneralSettingsForm) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/org/${params.orgSlug}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update settings')
      }
      
      toast.success('General settings updated successfully')
      resetGeneral(data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update settings')
    } finally {
      setIsLoading(false)
    }
  }

  const onBrandingSubmit = async (data: BrandingSettingsForm) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/org/${params.orgSlug}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          useCustomBranding: true, // Always true - force custom branding
        }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update branding settings')
      }
      
      toast.success('Branding settings updated successfully')
      resetBranding(data)
      
      // Refresh the page to apply new theme
      window.location.reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update settings')
    } finally {
      setIsLoading(false)
    }
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Building2 },
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ]

  const primaryColor = watchBranding('primaryColor')
  const secondaryColor = watchBranding('secondaryColor')
  const accentColor = watchBranding('accentColor')
  const backgroundColor = watchBranding('backgroundColor')
  const textColor = watchBranding('textColor')
  const buttonStyle = watchBranding('buttonStyle')

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organization Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your organization preferences and configuration
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-3 text-sm font-medium transition border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-theme-primary text-theme-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* General Tab */}
      {activeTab === 'general' && (
        <form onSubmit={handleSubmitGeneral(onGeneralSubmit)} className="space-y-6">
          <ThemeCard title="Organization Information" icon="Building2" color="primary">
            <div className="grid grid-cols-1 gap-4">
              <ThemeInput
                label="Organization Name *"
                icon={Building2}
                {...registerGeneral('name')}
                placeholder="Acme Inc."
                error={errorsGeneral.name?.message}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description
                </label>
                <textarea
                  {...registerGeneral('description')}
                  rows={3}
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                  placeholder="Tell us about your organization..."
                />
              </div>

              <ThemeInput
                label="Website"
                icon={Globe}
                {...registerGeneral('website')}
                type="url"
                placeholder="https://acme.com"
                error={errorsGeneral.website?.message}
              />

              <ThemeInput
                label="Billing Email"
                icon={Mail}
                {...registerGeneral('billingEmail')}
                type="email"
                placeholder="billing@acme.com"
                error={errorsGeneral.billingEmail?.message}
              />
            </div>
          </ThemeCard>

          <ThemeCard title="Organization Status" icon="Activity" color="secondary">
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <p className="text-sm text-gray-500">Current Plan</p>
                <ThemeBadge variant="primary" size="md">
                  {organization?.plan || 'FREE'}
                </ThemeBadge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <ThemeBadge 
                  variant={
                    organization?.status === 'ACTIVE' ? 'success' :
                    organization?.status === 'TRIAL' ? 'warning' : 'default'
                  }
                  size="md"
                >
                  {organization?.status || 'ACTIVE'}
                </ThemeBadge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Member Since</p>
                <p className="text-sm font-medium text-gray-900">
                  {organization?.createdAt ? new Date(organization.createdAt).toLocaleDateString() : '—'}
                </p>
              </div>
            </div>
          </ThemeCard>

          {isGeneralDirty && (
            <div className="flex justify-end">
              <ThemeButton type="submit" loading={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </ThemeButton>
            </div>
          )}
        </form>
      )}

      {/* Branding Tab - ALWAYS ENABLED, no checkbox */}
      {activeTab === 'branding' && (
        <form onSubmit={handleSubmitBranding(onBrandingSubmit)} className="space-y-6">
          <ThemeCard title="Brand Assets" icon="Globe" color="primary">
            <p className="text-sm text-gray-500 mb-4">
              Customize your organization's logo, favicon, and images
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo
                </label>
                <ImageUpload
                  value={watchBranding('logoUrl')}
                  onChange={(url) => setBrandingValue('logoUrl', url, { shouldDirty: true })}
                  folder={`org-${params.orgSlug}`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Recommended: 200x60px, PNG or SVG
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Favicon
                </label>
                <ImageUpload
                  value={watchBranding('faviconUrl')}
                  onChange={(url) => setBrandingValue('faviconUrl', url, { shouldDirty: true })}
                  folder={`org-${params.orgSlug}`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Recommended: 32x32px, ICO or PNG
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Login Page Image (Optional)
                </label>
                <ImageUpload
                  value={watchBranding('loginPageImage')}
                  onChange={(url) => setBrandingValue('loginPageImage', url, { shouldDirty: true })}
                  folder={`org-${params.orgSlug}`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Displayed on the login and registration pages
                </p>
              </div>
            </div>
          </ThemeCard>

          <ThemeCard title="Theme Colors" icon="Palette" color="primary">
            <p className="text-sm text-gray-500 mb-4">
              Choose the colors that represent your brand
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Primary Color *
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setBrandingValue('primaryColor', e.target.value, { shouldDirty: true })}
                    className="h-10 w-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    {...registerBranding('primaryColor')}
                    type="text"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono"
                    placeholder="#0a387c"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Secondary Color *
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setBrandingValue('secondaryColor', e.target.value, { shouldDirty: true })}
                    className="h-10 w-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    {...registerBranding('secondaryColor')}
                    type="text"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono"
                    placeholder="#0596eb"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Accent Color *
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setBrandingValue('accentColor', e.target.value, { shouldDirty: true })}
                    className="h-10 w-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    {...registerBranding('accentColor')}
                    type="text"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono"
                    placeholder="#f59e0b"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Background Color *
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBrandingValue('backgroundColor', e.target.value, { shouldDirty: true })}
                    className="h-10 w-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    {...registerBranding('backgroundColor')}
                    type="text"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono"
                    placeholder="#f8fafc"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Text Color *
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setBrandingValue('textColor', e.target.value, { shouldDirty: true })}
                    className="h-10 w-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    {...registerBranding('textColor')}
                    type="text"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono"
                    placeholder="#0f172a"
                  />
                </div>
              </div>
            </div>

            {/* Live Preview */}
            <div className="mt-6 p-4 rounded-lg border" style={{ backgroundColor: backgroundColor + '20' }}>
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
                      buttonStyle === 'pill' ? 'rounded-full' : 'rounded-none'
                    }`}
                    style={{ backgroundColor: primaryColor }}
                  >
                    Primary Button
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-2 text-white font-medium ${
                      buttonStyle === 'rounded' ? 'rounded-lg' : 
                      buttonStyle === 'pill' ? 'rounded-full' : 'rounded-none'
                    }`}
                    style={{ backgroundColor: secondaryColor }}
                  >
                    Secondary Button
                  </button>
                </div>
              </div>
            </div>
          </ThemeCard>

          <ThemeCard title="UI Settings" icon="Settings" color="primary">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Border Radius
                </label>
                <select
                  {...registerBranding('borderRadius')}
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                >
                  <option value="0">None</option>
                  <option value="0.25rem">Small</option>
                  <option value="0.5rem">Medium</option>
                  <option value="0.75rem">Large</option>
                  <option value="1rem">Extra Large</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Button Style
                </label>
                <select
                  {...registerBranding('buttonStyle')}
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                >
                  <option value="rounded">Rounded</option>
                  <option value="pill">Pill</option>
                  <option value="square">Square</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Font Family
                </label>
                <select
                  {...registerBranding('fontFamily')}
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                >
                  <option value="Inter">Inter</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Poppins">Poppins</option>
                  <option value="Open Sans">Open Sans</option>
                  <option value="Lato">Lato</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Custom Domain (Optional)
              </label>
              <ThemeInput
                icon={Globe}
                {...registerBranding('customDomain')}
                placeholder="members.yourdomain.com"
              />
              <p className="text-xs text-gray-500 mt-1">
                Point your domain to our servers and enter it here.
              </p>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Custom CSS (Advanced)
              </label>
              <textarea
                {...registerBranding('customCSS')}
                rows={5}
                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                placeholder="/* Add custom CSS overrides */"
              />
            </div>
          </ThemeCard>

          {isBrandingDirty && (
            <div className="flex justify-end">
              <ThemeButton type="submit" loading={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                Save Branding Changes
              </ThemeButton>
            </div>
          )}
        </form>
      )}

      {/* Team Tab */}
      {activeTab === 'team' && (
        <ThemeCard title="Team Management" icon="Users" color="primary">
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Team Management</h3>
            <p className="text-gray-500 mb-4">
              Manage team members and their roles from the house settings.
            </p>
            <Link
              href={`/org/${params.orgSlug}/houses`}
              className="text-theme-primary hover:text-theme-secondary font-medium"
            >
              Go to Houses →
            </Link>
          </div>
        </ThemeCard>
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <ThemeCard title="Billing Settings" icon="CreditCard" color="primary">
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Billing Management</h3>
            <p className="text-gray-500">
              Billing settings and subscription management coming soon.
            </p>
          </div>
        </ThemeCard>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <ThemeCard title="Security Settings" icon="Shield" color="primary">
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Security Settings</h3>
            <p className="text-gray-500">
              Two-factor authentication and security policies coming soon.
            </p>
          </div>
        </ThemeCard>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <ThemeCard title="Notification Settings" icon="Bell" color="primary">
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Notification Preferences</h3>
            <p className="text-gray-500">
              Email and push notification settings coming soon.
            </p>
          </div>
        </ThemeCard>
      )}
    </div>
  )
}