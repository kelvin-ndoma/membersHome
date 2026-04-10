// app/(platform)/platform/organizations/[orgId]/delete/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ArrowLeft, AlertTriangle, Trash2, Building2, Users, Home, Calendar } from 'lucide-react'

const deleteSchema = z.object({
  confirmation: z.string().refine(val => val === 'DELETE', {
    message: 'Please type DELETE to confirm'
  }),
  reason: z.string().optional(),
})

type DeleteForm = z.infer<typeof deleteSchema>

interface DeleteOrganizationPageProps {
  params: {
    orgId: string
  }
}

interface OrganizationSummary {
  id: string
  name: string
  slug: string
  plan: string
  status: string
  createdAt: string
  _count: {
    memberships: number
    houses: number
    events: number
    payments: number
  }
  houses: {
    id: string
    name: string
    _count: {
      members: number
    }
  }[]
  memberships: {
    user: {
      name: string | null
      email: string
    }
  }[]
}

export default function DeleteOrganizationPage({ params }: DeleteOrganizationPageProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingOrg, setIsLoadingOrg] = useState(true)
  const [organization, setOrganization] = useState<OrganizationSummary | null>(null)
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<DeleteForm>({
    resolver: zodResolver(deleteSchema),
  })

  const confirmation = watch('confirmation')

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const response = await fetch(`/api/platform/organizations/${params.orgId}`)
        const data = await response.json()
        
        if (!response.ok) {
          toast.error('Failed to load organization details')
          router.push('/platform/organizations')
          return
        }
        
        setOrganization(data.organization)
      } catch (error) {
        toast.error('Failed to load organization details')
        router.push('/platform/organizations')
      } finally {
        setIsLoadingOrg(false)
      }
    }

    fetchOrganization()
  }, [params.orgId, router])

  const onSubmit = async (data: DeleteForm) => {
    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/platform/organizations/${params.orgId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          permanent: true,
          reason: data.reason 
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Failed to delete organization')
        return
      }

      toast.success('Organization permanently deleted')
      router.push('/platform/organizations')
      router.refresh()
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingOrg) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Organization Not Found</h2>
          <p className="text-gray-600 mb-4">The organization you're trying to delete doesn't exist.</p>
          <Link
            href="/platform/organizations"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Organizations
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link 
          href={`/platform/organizations/${params.orgId}`}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Organization
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 px-6 py-5 border-b border-red-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-100 rounded-full">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Delete Organization</h1>
              <p className="text-sm text-gray-600 mt-0.5">
                This action is permanent and cannot be undone
              </p>
            </div>
          </div>
        </div>

        {/* Organization Summary */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Organization Summary</h2>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{organization.name}</h3>
                <p className="text-sm text-gray-500">{organization.slug}</p>
              </div>
              <div className="ml-auto flex gap-2">
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                  organization.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                  organization.status === 'SUSPENDED' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {organization.status}
                </span>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                  organization.plan === 'ENTERPRISE' ? 'bg-purple-100 text-purple-800' :
                  organization.plan === 'PROFESSIONAL' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {organization.plan}
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <Users className="h-5 w-5 text-gray-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-gray-900">{organization._count.memberships}</p>
              <p className="text-xs text-gray-500">Members</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <Home className="h-5 w-5 text-gray-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-gray-900">{organization._count.houses}</p>
              <p className="text-xs text-gray-500">Houses</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <Calendar className="h-5 w-5 text-gray-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-gray-900">{organization._count.events}</p>
              <p className="text-xs text-gray-500">Events</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <Trash2 className="h-5 w-5 text-gray-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-gray-900">{organization._count.payments}</p>
              <p className="text-xs text-gray-500">Payments</p>
            </div>
          </div>

          {/* Data to be deleted warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-red-800 mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              The following data will be permanently deleted:
            </h3>
            <ul className="space-y-2 text-sm text-red-700">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                <strong>{organization._count.memberships}</strong> member accounts and their data
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                <strong>{organization._count.houses}</strong> houses including:
                <ul className="ml-6 mt-1 space-y-1">
                  {organization.houses?.slice(0, 3).map((house) => (
                    <li key={house.id} className="text-xs">
                      • {house.name} ({house._count.members} members)
                    </li>
                  ))}
                  {organization.houses?.length > 3 && (
                    <li className="text-xs">• and {organization.houses.length - 3} more...</li>
                  )}
                </ul>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                <strong>{organization._count.events}</strong> events and associated tickets
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                <strong>{organization._count.payments}</strong> payment records
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                All forms, communications, and audit logs
              </li>
            </ul>
          </div>
        </div>

        {/* Owners Warning */}
        {organization.memberships?.filter(m => m.user).length > 0 && (
          <div className="px-6 py-4 bg-yellow-50 border-b border-yellow-200">
            <p className="text-sm text-yellow-800">
              <strong>Organization Owners:</strong>{' '}
              {organization.memberships.map(m => m.user.name || m.user.email).join(', ')}
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              Consider notifying owners before deletion
            </p>
          </div>
        )}

        {/* Delete Form */}
        <div className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="confirmation" className="block text-sm font-medium text-gray-700 mb-2">
                To confirm, type <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-red-600">DELETE</span> in the box below
              </label>
              <input
                {...register('confirmation')}
                type="text"
                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 font-mono text-lg"
                placeholder="DELETE"
                autoComplete="off"
                autoFocus
              />
              {errors.confirmation && (
                <p className="mt-1.5 text-sm text-red-600">{errors.confirmation.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                Reason for deletion (Optional)
              </label>
              <textarea
                {...register('reason')}
                rows={3}
                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Enter reason for permanently deleting this organization..."
              />
              <p className="mt-1 text-xs text-gray-500">
                This will be recorded in the audit log for compliance purposes
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Link
                href={`/platform/organizations/${params.orgId}`}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isLoading || confirmation !== 'DELETE'}
                className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <Trash2 className="h-4 w-4" />
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Permanently Delete Organization'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Final Warning */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          This action is irreversible. All data associated with this organization will be permanently removed from the system.
        </p>
      </div>
    </div>
  )
}