// components/platform/AddHouseButton.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, X, Home, Mail, Globe, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

const houseSchema = z.object({
  name: z.string().min(2, 'House name must be at least 2 characters'),
  slug: z.string()
    .min(2, 'Slug must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  managerEmail: z.string().email('Invalid email address'),
  managerName: z.string().min(2, 'Manager name must be at least 2 characters'),
  isPrivate: z.boolean().default(false),
})

type HouseForm = z.infer<typeof houseSchema>

interface AddHouseButtonProps {
  orgId: string
  orgName?: string
}

export default function AddHouseButton({ orgId, orgName }: AddHouseButtonProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<HouseForm>({
    resolver: zodResolver(houseSchema),
    defaultValues: {
      isPrivate: false
    }
  })

  const name = watch('name')

  const generateSlug = () => {
    if (name) {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      setValue('slug', slug)
    }
  }

  const onSubmit = async (data: HouseForm) => {
    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/platform/organizations/${orgId}/houses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Failed to create house')
        return
      }

      toast.success('House created successfully! Manager has been notified.')
      reset()
      setIsOpen(false)
      router.refresh()
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
      >
        <Plus className="h-4 w-4" />
        Add House
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/30 transition-opacity"
              onClick={() => setIsOpen(false)}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Create New House</h2>
                  {orgName && (
                    <p className="text-sm text-gray-500 mt-0.5">
                      For organization: {orgName}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                    House Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Home className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      {...register('name')}
                      type="text"
                      onChange={(e) => {
                        register('name').onChange(e)
                        generateSlug()
                      }}
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Engineering Team"
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-1.5 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Slug *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Globe className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      {...register('slug')}
                      type="text"
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="engineering"
                    />
                  </div>
                  {errors.slug && (
                    <p className="mt-1.5 text-sm text-red-600">{errors.slug.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Description (Optional)
                  </label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Brief description of this house..."
                  />
                </div>

                <div className="border-t border-gray-200 pt-5">
                  <h3 className="text-sm font-medium text-gray-900 mb-4">House Manager</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="managerName" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Manager Name *
                      </label>
                      <input
                        {...register('managerName')}
                        type="text"
                        className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Jane Smith"
                      />
                      {errors.managerName && (
                        <p className="mt-1.5 text-sm text-red-600">{errors.managerName.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="managerEmail" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Manager Email *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          {...register('managerEmail')}
                          type="email"
                          className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="manager@example.com"
                        />
                      </div>
                      {errors.managerEmail && (
                        <p className="mt-1.5 text-sm text-red-600">{errors.managerEmail.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      {...register('isPrivate')}
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Private House</span>
                    <Lock className="h-4 w-4 text-gray-400" />
                  </label>
                  <p className="text-xs text-gray-500 mt-1 ml-6">
                    Private houses are only visible to members
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {isLoading ? 'Creating...' : 'Create House'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}