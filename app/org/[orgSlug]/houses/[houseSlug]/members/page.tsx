// app/org/[orgSlug]/houses/[houseSlug]/members/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  Users, 
  Search, 
  Mail,
  UserPlus,
  Download,
  Upload,
  Shield,
  Crown,
  Eye,
  Package,
  Filter,
} from 'lucide-react'
import InviteMemberModal from '@/components/house/InviteMemberModal'

interface MembersPageProps {
  params: {
    orgSlug: string
    houseSlug: string
  }
}

export default function MembersPage({ params }: MembersPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [members, setMembers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [roleCounts, setRoleCounts] = useState<any[]>([])
  const [statusCounts, setStatusCounts] = useState<any[]>([])
  const [planCounts, setPlanCounts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [house, setHouse] = useState<any>(null)

  const page = parseInt(searchParams.get('page') || '1')
  const limit = 20
  const search = searchParams.get('search') || ''
  const role = searchParams.get('role')
  const status = searchParams.get('status') || 'ACTIVE'
  const planId = searchParams.get('planId')

  useEffect(() => {
    fetchMembers()
  }, [page, search, role, status, planId])

  const fetchMembers = async () => {
    setIsLoading(true)
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search,
        status,
        ...(role && { role }),
        ...(planId && { planId }),
      })

      const response = await fetch(`/api/org/${params.orgSlug}/houses/${params.houseSlug}/members?${queryParams}`)
      const data = await response.json()
      
      setHouse(data.house)
      setMembers(data.members)
      setTotal(data.pagination.total)
      setRoleCounts(data.roleCounts || [])
      setStatusCounts(data.statusCounts || [])
      setPlanCounts(data.planCounts || [])
    } catch (error) {
      console.error('Failed to fetch members:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const totalPages = Math.ceil(total / limit)

  const getRoleBadge = (memberRole: string) => {
    const configs = {
      HOUSE_MANAGER: { label: 'Manager', color: 'bg-purple-100 text-purple-800', icon: Crown },
      HOUSE_ADMIN: { label: 'Admin', color: 'bg-blue-100 text-blue-800', icon: Shield },
      HOUSE_STAFF: { label: 'Staff', color: 'bg-green-100 text-green-800', icon: Shield },
      HOUSE_MEMBER: { label: 'Member', color: 'bg-gray-100 text-gray-800', icon: Users },
    }
    const config = configs[memberRole as keyof typeof configs] || configs.HOUSE_MEMBER
    const Icon = config.icon
    
    return (
      <span className={`text-xs px-2 py-1 rounded-full inline-flex items-center gap-1 ${config.color}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    )
  }

  const getStatusBadge = (memberStatus: string) => {
    const configs = {
      ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-800' },
      PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      PAUSED: { label: 'Paused', color: 'bg-orange-100 text-orange-800' },
      EXPIRED: { label: 'Expired', color: 'bg-red-100 text-red-800' },
      BANNED: { label: 'Banned', color: 'bg-red-100 text-red-800' },
    }
    const config = configs[memberStatus as keyof typeof configs] || { label: memberStatus, color: 'bg-gray-100 text-gray-800' }
    
    return (
      <span className={`text-xs px-2 py-1 rounded-full ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const getPlanBadge = (membershipItem: any) => {
    if (!membershipItem?.membershipPlan) {
      return (
        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
          No Plan
        </span>
      )
    }
    
    const plan = membershipItem.membershipPlan
    const typeColors: Record<string, string> = {
      STANDARD: 'bg-blue-100 text-blue-800',
      PREMIUM: 'bg-purple-100 text-purple-800',
      VIP: 'bg-amber-100 text-amber-800',
      CUSTOM: 'bg-pink-100 text-pink-800',
    }
    
    const color = typeColors[plan.type] || 'bg-gray-100 text-gray-800'
    
    return (
      <span className={`text-xs px-2 py-1 rounded-full inline-flex items-center gap-1 ${color}`}>
        <Package className="h-3 w-3" />
        {plan.name}
        {membershipItem.planPrice && (
          <span className="ml-1 opacity-75">
            ({membershipItem.planPrice.currency} {membershipItem.planPrice.amount})
          </span>
        )}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Members</h1>
          <p className="text-sm text-gray-500 mt-1">
            {house?.name} • {total} total members
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/org/${params.orgSlug}/houses/${params.houseSlug}/members/import`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Upload className="h-4 w-4" />
            Import
          </Link>
          <Link
            href={`/org/${params.orgSlug}/houses/${params.houseSlug}/members/export`}
            className="inline-flex items-center gap-2 px-4 py-2 text13-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Export
          </Link>
          <button
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
          >
            <UserPlus className="h-4 w-4" />
            Invite Member
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="space-y-4">
          {/* Search */}
          <form className="w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="Search members by name or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </form>

          {/* Role Filter */}
          <div>
            <p className="text-xs text-gray-500 mb-2">Filter by Role</p>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`?${new URLSearchParams({ ...Object.fromEntries(searchParams), role: '' })}`}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                  !role ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Roles
              </Link>
              {roleCounts.map((r) => (
                <Link
                  key={r.role}
                  href={`?${new URLSearchParams({ ...Object.fromEntries(searchParams), role: r.role })}`}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                    role === r.role ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {r.role.replace('HOUSE_', '')} ({r._count})
                </Link>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <p className="text-xs text-gray-500 mb-2">Filter by Status</p>
            <div className="flex flex-wrap gap-2">
              {statusCounts.map((s) => (
                <Link
                  key={s.status}
                  href={`?${new URLSearchParams({ ...Object.fromEntries(searchParams), status: s.status })}`}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                    status === s.status ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {s.status} ({s._count})
                </Link>
              ))}
            </div>
          </div>

          {/* Plan Filter */}
          {planCounts.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Filter by Plan</p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`?${new URLSearchParams({ ...Object.fromEntries(searchParams), planId: '' })}`}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                    !planId ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Plans
                </Link>
                {planCounts.map((p) => (
                  <Link
                    key={p.planId}
                    href={`?${new URLSearchParams({ ...Object.fromEntries(searchParams), planId: p.planId })}`}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                      planId === p.planId ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {p.planName} ({p._count})
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="px-6 py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center flex-shrink-0">
                          {member.membership.user.image ? (
                            <img src={member.membership.user.image} alt="" className="w-10 h-10 rounded-full" />
                          ) : (
                            <span className="text-white text-sm font-medium">
                              {member.membership.user.name?.[0] || member.membership.user.email[0].toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {member.membership.user.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500">{member.membership.user.email}</p>
                          {member.memberProfile?.jobTitle && (
                            <p className="text-xs text-gray-400">{member.memberProfile.jobTitle}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getRoleBadge(member.role)}
                    </td>
                    <td className="px-6 py-4">
                      {getPlanBadge(member.membershipItem)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(member.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`mailto:${member.membership.user.email}`}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                          title="Send Email"
                        >
                          <Mail className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/org/${params.orgSlug}/houses/${params.houseSlug}/members/${member.id}`}
                          className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded"
                          title="View Member Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {members.length === 0 && (
              <div className="px-6 py-12 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">No members found</p>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
                >
                  <UserPlus className="h-4 w-4" />
                  Invite Your First Member
                </button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} members
                </p>
                <div className="flex gap-2">
                  {page > 1 && (
                    <Link
                      href={`?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: String(page - 1) })}`}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Previous
                    </Link>
                  )}
                  {page < totalPages && (
                    <Link
                      href={`?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: String(page + 1) })}`}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Next
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Invite Modal */}
      <InviteMemberModal 
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        orgSlug={params.orgSlug}
        houseSlug={params.houseSlug}
      />
    </div>
  )
}