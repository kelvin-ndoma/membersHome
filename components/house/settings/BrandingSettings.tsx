// components/house/settings/BrandingSettings.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Save, Palette, Eye, RefreshCcw, Layers, Check, Upload, X } from 'lucide-react'
import Image from 'next/image'
import ImageUpload from '@/components/ui/ImageUpload'

const brandingSchema = z.object({
  logoUrl: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  borderRadius: z.string().optional(),
  buttonStyle: z.enum(['rounded', 'pill', 'square']).optional(),
  fontFamily: z.string().optional(),
  useCustomBranding: z.boolean().default(false),
})

type BrandingForm = z.infer<typeof brandingSchema>

interface ThemeColors {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  textColor: string
  borderRadius: string
  buttonStyle: 'rounded' | 'pill' | 'square'
  fontFamily: string
  logoUrl: string
}

interface HierarchyData {
  platform: ThemeColors
  organization: Partial<ThemeColors> & { useCustomBranding?: boolean }
  house: Partial<ThemeColors> & { useCustomBranding?: boolean }
  portal: any
  effective: ThemeColors
}

interface BrandingSettingsProps {
  orgSlug: string
  houseSlug: string
  houseId: string
  house: {
    theme: any
    logoUrl?: string | null
    name: string
  }
}

export default function BrandingSettings({ 
  orgSlug, 
  houseSlug, 
  house 
}: BrandingSettingsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [hierarchy, setHierarchy] = useState<HierarchyData | null>(null)
  const [previewLevel, setPreviewLevel] = useState<'effective' | 'house' | 'organization' | 'platform'>('effective')
  const [isLoadingHierarchy, setIsLoadingHierarchy] = useState(true)
  
  const houseTheme = house.theme as any || {}
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { isDirty },
  } = useForm<BrandingForm>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      logoUrl: houseTheme?.logoUrl || house.logoUrl || '',
      primaryColor: houseTheme?.primaryColor || '',
      secondaryColor: houseTheme?.secondaryColor || '',
      accentColor: houseTheme?.accentColor || '',
      backgroundColor: houseTheme?.backgroundColor || '',
      textColor: houseTheme?.textColor || '',
      borderRadius: houseTheme?.borderRadius || '',
      buttonStyle: houseTheme?.buttonStyle || 'rounded',
      fontFamily: houseTheme?.fontFamily || 'Inter',
      useCustomBranding: houseTheme?.useCustomBranding || false,
    }
  })

  // Fetch hierarchy data
  useEffect(() => {
    fetchHierarchy()
  }, [orgSlug, houseSlug])

  const fetchHierarchy = async () => {
    try {
      setIsLoadingHierarchy(true)
      const response = await fetch(`/api/org/${orgSlug}/houses/${houseSlug}/settings`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch hierarchy')
      }
      
      const data = await response.json()
      setHierarchy(data.hierarchy)
      
      // Reset form with current house theme
      if (data.hierarchy?.house) {
        reset({
          logoUrl: data.hierarchy.house.logoUrl || '',
          primaryColor: data.hierarchy.house.primaryColor || '',
          secondaryColor: data.hierarchy.house.secondaryColor || '',
          accentColor: data.hierarchy.house.accentColor || '',
          backgroundColor: data.hierarchy.house.backgroundColor || '',
          textColor: data.hierarchy.house.textColor || '',
          borderRadius: data.hierarchy.house.borderRadius || '',
          buttonStyle: (data.hierarchy.house.buttonStyle as 'rounded' | 'pill' | 'square') || 'rounded',
          fontFamily: data.hierarchy.house.fontFamily || 'Inter',
          useCustomBranding: data.hierarchy.house.useCustomBranding || false,
        })
      }
    } catch (error) {
      console.error('Failed to fetch hierarchy:', error)
      toast.error('Failed to load branding hierarchy')
    } finally {
      setIsLoadingHierarchy(false)
    }
  }

  const useCustomBranding = watch('useCustomBranding')
  const primaryColor = watch('primaryColor')
  const secondaryColor = watch('secondaryColor')
  const accentColor = watch('accentColor')
  const backgroundColor = watch('backgroundColor')
  const textColor = watch('textColor')
  const buttonStyle = watch('buttonStyle')
  const borderRadius = watch('borderRadius')
  const fontFamily = watch('fontFamily')
  const logoUrl = watch('logoUrl')

  const onSubmit = async (data: BrandingForm) => {
    setIsLoading(true)
    
    try {
      const validButtonStyle = data.buttonStyle === 'pill' || data.buttonStyle === 'square' 
        ? data.buttonStyle 
        : 'rounded'

      const response = await fetch(`/api/org/${orgSlug}/houses/${houseSlug}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: {
            logoUrl: data.logoUrl || null,
            primaryColor: data.primaryColor || null,
            secondaryColor: data.secondaryColor || null,
            accentColor: data.accentColor || null,
            backgroundColor: data.backgroundColor || null,
            textColor: data.textColor || null,
            borderRadius: data.borderRadius || null,
            buttonStyle: validButtonStyle,
            fontFamily: data.fontFamily || null,
            useCustomBranding: data.useCustomBranding,
          }
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Failed to update branding')
        return
      }

      toast.success('Branding settings updated successfully')
      router.refresh()
      fetchHierarchy()
    } catch (error) {
      console.error('Submit error:', error)
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const resetToOrganization = () => {
    if (hierarchy?.organization) {
      const getValidButtonStyle = (style: string | undefined): 'rounded' | 'pill' | 'square' => {
        if (style === 'pill') return 'pill'
        if (style === 'square') return 'square'
        return 'rounded'
      }

      reset({
        logoUrl: hierarchy.organization.logoUrl || '',
        primaryColor: hierarchy.organization.primaryColor || '',
        secondaryColor: hierarchy.organization.secondaryColor || '',
        accentColor: hierarchy.organization.accentColor || '',
        backgroundColor: hierarchy.organization.backgroundColor || '',
        textColor: hierarchy.organization.textColor || '',
        borderRadius: hierarchy.organization.borderRadius || '',
        buttonStyle: getValidButtonStyle(hierarchy.organization.buttonStyle || undefined),
        fontFamily: hierarchy.organization.fontFamily || 'Inter',
        useCustomBranding: true,
      })
      toast.success('Reset to organization branding')
    }
  }

  const getPreviewTheme = (): ThemeColors | null => {
    if (!hierarchy) return null
    
    const defaultColors: ThemeColors = {
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      accentColor: '#10B981',
      backgroundColor: '#F9FAFB',
      textColor: '#111827',
      borderRadius: '0.5rem',
      buttonStyle: 'rounded',
      fontFamily: 'Inter',
      logoUrl: '',
    }
    
    const getButtonStyle = (style: string | undefined | null): 'rounded' | 'pill' | 'square' => {
      if (style === 'pill') return 'pill'
      if (style === 'square') return 'square'
      return 'rounded'
    }
    
    switch(previewLevel) {
      case 'house':
        return {
          primaryColor: primaryColor || hierarchy.house.primaryColor || hierarchy.organization.primaryColor || hierarchy.platform.primaryColor || defaultColors.primaryColor,
          secondaryColor: secondaryColor || hierarchy.house.secondaryColor || hierarchy.organization.secondaryColor || hierarchy.platform.secondaryColor || defaultColors.secondaryColor,
          accentColor: accentColor || hierarchy.house.accentColor || hierarchy.organization.accentColor || hierarchy.platform.accentColor || defaultColors.accentColor,
          backgroundColor: backgroundColor || hierarchy.house.backgroundColor || hierarchy.organization.backgroundColor || hierarchy.platform.backgroundColor || defaultColors.backgroundColor,
          textColor: textColor || hierarchy.house.textColor || hierarchy.organization.textColor || hierarchy.platform.textColor || defaultColors.textColor,
          borderRadius: borderRadius || hierarchy.house.borderRadius || hierarchy.organization.borderRadius || hierarchy.platform.borderRadius || defaultColors.borderRadius,
          buttonStyle: getButtonStyle(buttonStyle || hierarchy.house.buttonStyle || hierarchy.organization.buttonStyle || hierarchy.platform.buttonStyle),
          fontFamily: fontFamily || hierarchy.house.fontFamily || hierarchy.organization.fontFamily || hierarchy.platform.fontFamily || defaultColors.fontFamily,
          logoUrl: logoUrl || hierarchy.house.logoUrl || hierarchy.organization.logoUrl || hierarchy.platform.logoUrl || '',
        }
      case 'organization':
        return {
          primaryColor: hierarchy.organization.primaryColor || hierarchy.platform.primaryColor || defaultColors.primaryColor,
          secondaryColor: hierarchy.organization.secondaryColor || hierarchy.platform.secondaryColor || defaultColors.secondaryColor,
          accentColor: hierarchy.organization.accentColor || hierarchy.platform.accentColor || defaultColors.accentColor,
          backgroundColor: hierarchy.organization.backgroundColor || hierarchy.platform.backgroundColor || defaultColors.backgroundColor,
          textColor: hierarchy.organization.textColor || hierarchy.platform.textColor || defaultColors.textColor,
          borderRadius: hierarchy.organization.borderRadius || hierarchy.platform.borderRadius || defaultColors.borderRadius,
          buttonStyle: getButtonStyle(hierarchy.organization.buttonStyle || hierarchy.platform.buttonStyle),
          fontFamily: hierarchy.organization.fontFamily || hierarchy.platform.fontFamily || defaultColors.fontFamily,
          logoUrl: hierarchy.organization.logoUrl || hierarchy.platform.logoUrl || '',
        }
      case 'platform':
        return hierarchy.platform
      default:
        return hierarchy.effective
    }
  }

  const previewTheme = getPreviewTheme()

  if (isLoadingHierarchy) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Hierarchy Indicator */}
      {hierarchy && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-900">Branding Hierarchy</span>
            </div>
            {!useCustomBranding && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                Using Organization Branding
              </span>
            )}
            {useCustomBranding && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                <Check className="h-3 w-3 inline mr-1" />
                Using Custom Branding
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>Platform</span>
            <span className="text-gray-400">→</span>
            <span>Organization</span>
            <span className="text-gray-400">→</span>
            <span className={useCustomBranding ? 'font-semibold text-blue-600' : ''}>
              House {useCustomBranding && '(Custom)'}
            </span>
            <span className="text-gray-400">→</span>
            <span>Member Portal</span>
          </div>
        </div>
      )}

      {/* Enable Custom Branding Toggle */}
      <div className="bg-gray-50 rounded-lg p-4">
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <span className="font-medium text-gray-900">Use Custom Branding</span>
            <p className="text-sm text-gray-500">Override organization colors and logo for this house</p>
          </div>
          <input
            {...register('useCustomBranding')}
            type="checkbox"
            className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
          />
        </label>
      </div>

      {useCustomBranding && (
        <>
          {/* Logo Upload Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              House Logo
            </label>
            <div className="mt-1">
              {/* Logo Preview */}
              {logoUrl && (
                <div className="mb-3">
                  <div className="relative inline-block">
                    <div className="relative w-32 h-32 border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                      <Image
                        src={logoUrl}
                        alt="House logo"
                        fill
                        className="object-contain p-2"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setValue('logoUrl', '', { shouldDirty: true })}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}
              
              {/* Upload Component */}
              <ImageUpload
                value={logoUrl}
                onChange={(url) => setValue('logoUrl', url, { shouldDirty: true })}
                folder={`houses/${houseSlug}`}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Recommended: 200x200px square or 200x60px rectangle, PNG or SVG with transparent background
            </p>
          </div>

          {/* Current Organization Logo Display */}
          {hierarchy?.organization?.logoUrl && !logoUrl && (
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
              <p className="text-xs text-blue-700 mb-2">Currently using organization logo:</p>
              <div className="relative w-24 h-12">
                <Image
                  src={hierarchy.organization.logoUrl}
                  alt="Organization logo"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          )}

          {/* Theme Colors */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Theme Colors</h3>
              <button
                type="button"
                onClick={resetToOrganization}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <RefreshCcw className="h-3 w-3" />
                Reset to Organization
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Primary Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Primary Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryColor || '#3B82F6'}
                    onChange={(e) => setValue('primaryColor', e.target.value, { shouldDirty: true })}
                    className="h-10 w-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    {...register('primaryColor')}
                    type="text"
                    placeholder="#3B82F6"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                  />
                </div>
                {hierarchy?.organization?.primaryColor && !primaryColor && (
                  <p className="text-xs text-gray-500 mt-1">
                    Organization default: {hierarchy.organization.primaryColor}
                  </p>
                )}
              </div>

              {/* Secondary Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Secondary Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={secondaryColor || '#1E40AF'}
                    onChange={(e) => setValue('secondaryColor', e.target.value, { shouldDirty: true })}
                    className="h-10 w-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    {...register('secondaryColor')}
                    type="text"
                    placeholder="#1E40AF"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                  />
                </div>
              </div>

              {/* Accent Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Accent Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={accentColor || '#10B981'}
                    onChange={(e) => setValue('accentColor', e.target.value, { shouldDirty: true })}
                    className="h-10 w-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    {...register('accentColor')}
                    type="text"
                    placeholder="#10B981"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                  />
                </div>
              </div>

              {/* Background Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Background Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={backgroundColor || '#F9FAFB'}
                    onChange={(e) => setValue('backgroundColor', e.target.value, { shouldDirty: true })}
                    className="h-10 w-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    {...register('backgroundColor')}
                    type="text"
                    placeholder="#F9FAFB"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                  />
                </div>
              </div>

              {/* Text Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Text Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={textColor || '#111827'}
                    onChange={(e) => setValue('textColor', e.target.value, { shouldDirty: true })}
                    className="h-10 w-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    {...register('textColor')}
                    type="text"
                    placeholder="#111827"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                  />
                </div>
              </div>

              {/* Border Radius */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Border Radius
                </label>
                <select
                  {...register('borderRadius')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Default</option>
                  <option value="0rem">Square (0rem)</option>
                  <option value="0.25rem">Small (0.25rem)</option>
                  <option value="0.5rem">Medium (0.5rem)</option>
                  <option value="0.75rem">Large (0.75rem)</option>
                  <option value="1rem">Extra Large (1rem)</option>
                </select>
              </div>

              {/* Button Style */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Button Style
                </label>
                <select
                  {...register('buttonStyle')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="rounded">Rounded</option>
                  <option value="pill">Pill (Fully Rounded)</option>
                  <option value="square">Square</option>
                </select>
              </div>

              {/* Font Family */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Font Family
                </label>
                <select
                  {...register('fontFamily')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Inter">Inter</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Open Sans">Open Sans</option>
                  <option value="Poppins">Poppins</option>
                  <option value="Montserrat">Montserrat</option>
                </select>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Live Preview with Hierarchy Selector */}
      {previewTheme && (
        <div className="mt-6 p-4 rounded-lg border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Live Preview</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPreviewLevel('effective')}
                className={`text-xs px-2 py-1 rounded transition ${
                  previewLevel === 'effective'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                Effective
              </button>
              <button
                type="button"
                onClick={() => setPreviewLevel('house')}
                className={`text-xs px-2 py-1 rounded transition ${
                  previewLevel === 'house'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                House
              </button>
              <button
                type="button"
                onClick={() => setPreviewLevel('organization')}
                className={`text-xs px-2 py-1 rounded transition ${
                  previewLevel === 'organization'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                Organization
              </button>
              <button
                type="button"
                onClick={() => setPreviewLevel('platform')}
                className={`text-xs px-2 py-1 rounded transition ${
                  previewLevel === 'platform'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                Platform
              </button>
            </div>
          </div>
          
          <div 
            className="p-6 rounded-lg transition-all"
            style={{ 
              backgroundColor: previewTheme.backgroundColor,
              borderRadius: previewTheme.borderRadius,
              fontFamily: previewTheme.fontFamily
            }}
          >
            <div className="space-y-4">
              {/* Logo Area */}
              {previewTheme.logoUrl && (
                <div className="flex justify-center">
                  <div className="relative h-16 w-auto">
                    <Image
                      src={previewTheme.logoUrl}
                      alt="Logo"
                      width={200}
                      height={64}
                      className="h-16 w-auto object-contain"
                    />
                  </div>
                </div>
              )}
              
              {/* Sample Header */}
              <div 
                className="flex items-center justify-between p-4 rounded-lg" 
                style={{ backgroundColor: previewTheme.primaryColor + '20' }}
              >
                <h3 className="font-semibold" style={{ color: previewTheme.primaryColor }}>
                  {previewLevel === 'effective' ? 'Effective Theme' : `${previewLevel.charAt(0).toUpperCase() + previewLevel.slice(1)} Theme`}
                </h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={`px-4 py-2 text-white transition ${
                      previewTheme.buttonStyle === 'pill' ? 'rounded-full' : 
                      previewTheme.buttonStyle === 'square' ? 'rounded-none' : 'rounded-lg'
                    }`}
                    style={{ backgroundColor: previewTheme.primaryColor }}
                  >
                    Primary
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-2 text-white transition ${
                      previewTheme.buttonStyle === 'pill' ? 'rounded-full' : 
                      previewTheme.buttonStyle === 'square' ? 'rounded-none' : 'rounded-lg'
                    }`}
                    style={{ backgroundColor: previewTheme.secondaryColor }}
                  >
                    Secondary
                  </button>
                </div>
              </div>
              
              {/* Sample Content */}
              <div 
                className="p-4 rounded-lg border" 
                style={{ borderColor: previewTheme.primaryColor + '40' }}
              >
                <h4 className="font-medium mb-2" style={{ color: previewTheme.textColor }}>
                  Welcome to {house.name}
                </h4>
                <p className="text-sm" style={{ color: previewTheme.textColor + 'CC' }}>
                  This is a preview of how your branding will appear to members.
                </p>
                <div className="mt-3 flex gap-2">
                  <span 
                    className="text-xs px-2 py-1 rounded" 
                    style={{ 
                      backgroundColor: previewTheme.accentColor + '20', 
                      color: previewTheme.accentColor 
                    }}
                  >
                    Accent Badge
                  </span>
                </div>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3 text-center">
            Showing: {previewLevel === 'effective' ? 'Final theme after applying all overrides' : `${previewLevel} level theme`}
          </p>
        </div>
      )}

      {/* Save Button */}
      {isDirty && useCustomBranding && (
        <div className="flex justify-end pt-4 border-t">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            {isLoading ? 'Saving...' : 'Save Branding Changes'}
          </button>
        </div>
      )}
    </form>
  )
}