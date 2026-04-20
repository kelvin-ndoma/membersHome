// app/(platform)/platform/organizations/page.tsx
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Building2, Plus, MoreVertical, Users, Calendar, Home, Globe, CreditCard } from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import { ThemeCard } from '@/components/ui/ThemeCard'
import { ThemeBadge } from '@/components/ui/ThemeBadge'
import { ThemeButton } from '@/components/ui/ThemeButton'

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
              email: true,
              image: true,
            }
          }
        },
        take: 1
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  const activeOrgs = organizations.filter(org => org.status === 'ACTIVE').length
  const trialOrgs = organizations.filter(org => org.status === 'TRIAL').length
  const totalMembers = organizations.reduce((acc, org) => acc + org._count.memberships, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage all organizations on the platform
          </p>
        </div>
        <Link href="/platform/organizations/create">
          <ThemeButton>
            <Plus className="h-4 w-4 mr-2" />
            Create Organization
          </ThemeButton>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          name="Total Organizations"
          value={organizations.length}
          icon="Building2"
          color="primary"
        />
        <StatCard
          name="Active Organizations"
          value={activeOrgs}
          icon="CheckCircle"
          color="secondary"
        />
        <StatCard
          name="Trial Organizations"
          value={trialOrgs}
          icon="Clock"
          color="accent"
        />
        <StatCard
          name="Total Members"
          value={totalMembers}
          icon="Users"
          color="primary"
        />
      </div>

      {/* Organizations Grid */}
      {organizations.length === 0 ? (
        <ThemeCard
          title="No organizations yet"
          description="Get started by creating your first organization."
          icon="Building2"
          color="primary"
        >
          <Link href="/platform/organizations/create">
            <ThemeButton className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Create Organization
            </ThemeButton>
          </Link>
        </ThemeCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {organizations.map((org) => {
            const owner = org.memberships[0]?.user
            
            return (
              <div 
                key={org.id} 
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-theme-primary/30 transition-all group"
              >
                {/* Card Header with Logo */}
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <Link 
                      href={`/platform/organizations/${org.id}`}
                      className="flex items-center gap-3 flex-1"
                    >
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ 
                          background: `linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-secondary) 100%)` 
                        }}
                      >
                        {org.logoUrl ? (
                          <img src={org.logoUrl} alt={org.name} className="w-8 h-8 rounded object-cover" />
                        ) : (
                          <Building2 className="h-6 w-6 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-theme-primary truncate transition-colors">
                          {org.name}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">{org.slug}</p>
                      </div>
                    </Link>
                    <button className="p-1.5 hover:bg-gray-100 rounded-lg transition opacity-0 group-hover:opacity-100">
                      <MoreVertical className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>

                  {org.description && (
                    <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                      {org.description}
                    </p>
                  )}

                  {/* Badges */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <ThemeBadge 
                      variant={
                        org.plan === 'ENTERPRISE' ? 'primary' :
                        org.plan === 'PROFESSIONAL' ? 'secondary' :
                        org.plan === 'STARTER' ? 'accent' : 'default'
                      }
                      size="sm"
                    >
                      {org.plan}
                    </ThemeBadge>
                    <ThemeBadge 
                      variant={
                        org.status === 'ACTIVE' ? 'success' :
                        org.status === 'SUSPENDED' ? 'danger' :
                        org.status === 'TRIAL' ? 'warning' : 'default'
                      }
                      size="sm"
                    >
                      {org.status}
                    </ThemeBadge>
                    {org.website && (
                      <ThemeBadge variant="default" size="sm" icon="Globe">
                        Website
                      </ThemeBadge>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{org._count.memberships}</span>
                      <span>members</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Home className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{org._count.houses}</span>
                      <span>houses</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{org._count.events}</span>
                      <span>events</span>
                    </div>
                  </div>
                </div>

                {/* Owner Section */}
                {owner && (
                  <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">Organization Owner</p>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium"
                           style={{ background: `var(--theme-primary)` }}>
                        {owner.image ? (
                          <img src={owner.image} alt="" className="w-7 h-7 rounded-full object-cover" />
                        ) : (
                          owner.name?.[0] || owner.email[0].toUpperCase()
                        )}
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

                {/* Card Footer */}
                <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    Created {new Date(org.createdAt).toLocaleDateString()}
                  </p>
                  <Link
                    href={`/platform/organizations/${org.id}`}
                    className="text-xs font-medium text-theme-primary hover:text-theme-secondary transition-colors"
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