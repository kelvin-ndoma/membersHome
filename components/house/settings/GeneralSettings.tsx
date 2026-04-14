// components/house/settings/GeneralSettings.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Save, Home, Globe } from 'lucide-react'
import ImageUpload from '@/components/ui/ImageUpload'

const generalSchema = z.object({
  name: z.string().min(2, 'House name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  logoUrl: z.string().optional(),
})

type GeneralForm = z.infer<typeof generalSchema>

interface GeneralSettingsProps {
  house: {
    id: string
    name: string
    slug: string
    description: string | null
    logoUrl: string | null
  }
}

export default function GeneralSettings({ house }: GeneralSettingsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<GeneralForm>({
    resolver: zodResolver(generalSchema),
    defaultValues: {
      name: house.name,
      slug: house.slug,
      description: house.description || '',
      logoUrl: house.logoUrl || '',
    }
  })

  const name = watch('name')

  const generateSlug = () => {
    if (name) {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      setValue('slug', slug, { shouldDirty: true })
    }
  }

  const onSubmit = async (data: GeneralForm) => {
    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/houses/${house.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Failed to update settings')
        return
      }

      toast.success('Settings updated successfully')
      router.refresh()
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Logo Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          House Logo (Optional)
        </label>
        <ImageUpload
          value={watch('logoUrl')}
          onChange={(url) => setValue('logoUrl', url, { shouldDirty: true })}
          folder="house-logos"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            House Name *
          </label>
          <div className="relative">
            <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              {...register('name')}
              type="text"
              onChange={(e) => {
                register('name').onChange(e)
                generateSlug()
              }}
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Main House"
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Slug *
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              {...register('slug')}
              type="text"
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="main-house"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Used in URLs: /{watch('slug')}
          </p>
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
            rows={3}
            className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Describe your house..."
          />
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