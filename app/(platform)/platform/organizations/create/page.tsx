// app/(platform)/platform/organizations/create/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ArrowLeft, Building2, Globe, Mail, Home, Plus, Trash2 } from 'lucide-react'

const houseSchema = z.object({
  name: z.string().min(2, 'House name must be at least 2 characters'),
  slug: z.string()
    .min(2, 'Slug must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  isPrivate: z.boolean().default(false),
})

const organizationSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  slug: z.string()
    .min(2, 'Slug must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  plan: z.enum(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE']),
  billingEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  ownerEmail: z.string().email('Invalid owner email address'),
  ownerName: z.string().min(2, 'Owner name must be at least 2 characters'),
  houses: z.array(houseSchema).min(1, 'At least one house is required'),
})

type OrganizationForm = z.infer<typeof organizationSchema>

export default function CreateOrganizationPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<OrganizationForm>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      plan: 'FREE',
      houses: [{
        name: '',
        slug: '',
        description: '',
        isPrivate: false,
      }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'houses',
  })

  const orgName = watch('name')

  const generateOrgSlug = () => {
    if (orgName) {
      const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      setValue('slug', slug)
    }
  }

  const generateHouseSlug = (index: number) => {
    const houseName = watch(`houses.${index}.name`)
    if (houseName) {
      const slug = houseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      setValue(`houses.${index}.slug`, slug)
    }
  }

  const addHouse = () => {
    append({
      name: '',
      slug: '',
      description: '',
      isPrivate: false,
    })
  }

  const onSubmit = async (data: OrganizationForm) => {
    setIsLoading(true)
    
    try {
      // First create the organization with the first house as default
      const response = await fetch('/api/platform/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          slug: data.slug,
          description: data.description,
          plan: data.plan,
          billingEmail: data.billingEmail,
          website: data.website,
          ownerEmail: data.ownerEmail,
          ownerName: data.ownerName,
          defaultHouseName: data.houses[0].name,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Failed to create organization')
        return
      }

      // If there are more houses, create them
      if (data.houses.length > 1) {
        const orgId = result.organization.id
        
        // Create remaining houses (owner becomes default manager)
        for (let i = 1; i < data.houses.length; i++) {
          const house = data.houses[i]
          await fetch(`/api/platform/organizations/${orgId}/houses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...house,
              managerEmail: data.ownerEmail,
              managerName: data.ownerName,
            }),
          })
        }
        
        toast.success(`Organization created with ${data.houses.length} houses!`)
      } else {
        toast.success('Organization and house created successfully!')
      }
      
      router.push('/platform/organizations')
      router.refresh()
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link 
          href="/platform/organizations"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to organizations
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create Organization</h1>
          <p className="text-sm text-gray-500 mt-1">
            Add a new organization to the platform. Create one or more houses.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Organization Details Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Organization Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Organization Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    {...register('name')}
                    type="text"
                    onChange={(e) => {
                      register('name').onChange(e)
                      generateOrgSlug()
                    }}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Acme Inc."
                  />
                </div>
                {errors.name && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
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
                    placeholder="acme-inc"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  URL: {process.env.NEXT_PUBLIC_APP_URL}/org/{watch('slug') || 'your-org'}
                </p>
                {errors.slug && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.slug.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief description of the organization..."
                />
              </div>

              <div>
                <label htmlFor="plan" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Plan *
                </label>
                <select
                  {...register('plan')}
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="FREE">Free</option>
                  <option value="STARTER">Starter</option>
                  <option value="PROFESSIONAL">Professional</option>
                  <option value="ENTERPRISE">Enterprise</option>
                </select>
              </div>

              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Website (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Globe className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    {...register('website')}
                    type="url"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://acme.com"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Owner Details Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Organization Owner
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Owner Name *
                </label>
                <input
                  {...register('ownerName')}
                  type="text"
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="John Doe"
                />
                {errors.ownerName && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.ownerName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="ownerEmail" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Owner Email *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    {...register('ownerEmail')}
                    type="email"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="owner@acme.com"
                  />
                </div>
                {errors.ownerEmail && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.ownerEmail.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="billingEmail" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Billing Email (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    {...register('billingEmail')}
                    type="email"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="billing@acme.com"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Houses Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="text-lg font-semibold text-gray-900">
                Houses
              </h2>
              <button
                type="button"
                onClick={addHouse}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
              >
                <Plus className="h-4 w-4" />
                Add Another House
              </button>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Create one or more houses for this organization. 
                The organization owner will be assigned as the manager of all houses.
              </p>
            </div>

            {errors.houses && (
              <p className="text-sm text-red-600">{errors.houses.message}</p>
            )}

            <div className="space-y-6">
              {fields.map((field, index) => (
                <div key={field.id} className="relative bg-gray-50 rounded-lg p-5 border border-gray-200">
                  <div className="absolute -top-3 left-4 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    {index === 0 ? 'Primary House' : `House ${index + 1}`}
                  </div>
                  
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="absolute -top-3 right-4 p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        House Name *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Home className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          {...register(`houses.${index}.name`)}
                          type="text"
                          onChange={(e) => {
                            register(`houses.${index}.name`).onChange(e)
                            generateHouseSlug(index)
                          }}
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder={index === 0 ? "Main House" : "Engineering Team"}
                        />
                      </div>
                      {errors.houses?.[index]?.name && (
                        <p className="mt-1 text-xs text-red-600">{errors.houses[index]?.name?.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Slug *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Globe className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          {...register(`houses.${index}.slug`)}
                          type="text"
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder={index === 0 ? "main" : "engineering"}
                        />
                      </div>
                      {errors.houses?.[index]?.slug && (
                        <p className="mt-1 text-xs text-red-600">{errors.houses[index]?.slug?.message}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Description (Optional)
                      </label>
                      <textarea
                        {...register(`houses.${index}.description`)}
                        rows={2}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Brief description of this house..."
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2">
                        <input
                          {...register(`houses.${index}.isPrivate`)}
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">Private House</span>
                      </label>
                      <p className="text-xs text-gray-500 mt-1 ml-6">
                        Private houses are only visible to members
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Summary</h3>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Organization: <strong>{orgName || '—'}</strong></li>
              <li>• Owner: <strong>{watch('ownerName') || '—'}</strong> ({watch('ownerEmail') || '—'})</li>
              <li>• Houses: <strong>{fields.length}</strong> house{fields.length !== 1 ? 's' : ''}</li>
              <li>• Plan: <strong>{watch('plan')}</strong></li>
            </ul>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <Link
              href="/platform/organizations"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isLoading ? 'Creating...' : `Create Organization & ${fields.length} House${fields.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}