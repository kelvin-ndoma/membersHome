// app/(platform)/platform/organizations/page.tsx
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Building2, Plus, MoreVertical, Users, Calendar, Home } from 'lucide-react'

export default async function OrganizationsPage() {
  const organizations = await prisma.organization.findMany({
    include: {
      _count: {
        select: {
          memberships: true,
          events: true,
          houses: true
        }
      },
      memberships: {
        where: {
          role: 'ORG_OWNER'
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        take: 1
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage all organizations on the platform
          </p>
        </div>
        <Link
          href="/platform/organizations/create"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="h-4 w-4" />
          Create Organization
        </Link>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Total Organizations</p>
            <Building2 className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{organizations.length}</p>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Active Organizations</p>
            <div className="h-5 w-5 rounded-full bg-green-500"></div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {organizations.filter(org => org.status === 'ACTIVE').length}
          </p>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Trial Organizations</p>
            <div className="h-5 w-5 rounded-full bg-yellow-500"></div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {organizations.filter(org => org.status === 'TRIAL').length}
          </p>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Total Members</p>
            <Users className="h-5 w-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {organizations.reduce((acc, org) => acc + org._count.memberships, 0)}
          </p>
        </div>
      </div>

      {/* Organizations Grid */}
      {organizations.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No organizations yet</h3>
          <p className="text-gray-500 mb-4">Get started by creating your first organization.</p>
          <Link
            href="/platform/organizations/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="h-4 w-4" />
            Create Organization
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {organizations.map((org) => {
            const owner = org.memberships[0]?.user
            
            return (
              <div 
                key={org.id} 
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition group"
              >
                <div className="flex items-start justify-between">
                  <Link 
                    href={`/platform/organizations/${org.id}`}
                    className="flex items-center gap-3 flex-1"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      {org.logoUrl ? (
                        <img src={org.logoUrl} alt={org.name} className="w-8 h-8 rounded object-cover" />
                      ) : (
                        <Building2 className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 truncate">
                        {org.name}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">{org.slug}</p>
                    </div>
                  </Link>
                  <div className="relative">
                    <button className="p-1.5 hover:bg-gray-100 rounded-lg transition">
                      <MoreVertical className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                </div>

                {org.description && (
                  <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                    {org.description}
                  </p>
                )}

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      org.plan === 'ENTERPRISE' ? 'bg-purple-100 text-purple-800' :
                      org.plan === 'PROFESSIONAL' ? 'bg-blue-100 text-blue-800' :
                      org.plan === 'STARTER' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {org.plan}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      org.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                      org.status === 'SUSPENDED' ? 'bg-red-100 text-red-800' :
                      org.status === 'TRIAL' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {org.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{org._count.memberships}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Home className="h-4 w-4" />
                      <span>{org._count.houses}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{org._count.events}</span>
                    </div>
                  </div>
                </div>

                {owner && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Owner</p>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-700 text-xs font-medium">
                          {owner.name?.[0] || owner.email[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {owner.name || '—'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{owner.email}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    Created {new Date(org.createdAt).toLocaleDateString()}
                  </p>
                  <Link
                    href={`/platform/organizations/${org.id}`}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}