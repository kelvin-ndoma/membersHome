// app/portal/[houseSlug]/communities/[communitySlug]/members/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Users,
  Search,
  Filter,
  Crown,
  Shield,
  MoreVertical,
  UserMinus,
  UserCog,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface Member {
  id: string
  userId: string
  name: string
  email: string
  image: string | null
  role: 'MEMBER' | 'MODERATOR' | 'ADMIN' | 'OWNER'
  status: 'ACTIVE' | 'PENDING' | 'BANNED'
  joinedAt: string
  lastActiveAt?: string
}

export default function CommunityMembersPage() {
  const params = useParams()
  const router = useRouter()
  const houseSlug = params.houseSlug as string
  const communitySlug = params.communitySlug as string
  
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentUserRole, setCurrentUserRole] = useState<string>('')
  const [pendingCount, setPendingCount] = useState(0)
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showFilter, setShowFilter] = useState(false)

  useEffect(() => {
    fetchMembers()
  }, [communitySlug, page, roleFilter, statusFilter])

  const fetchMembers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(roleFilter !== 'all' && { role: roleFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      })
      
      const response = await fetch(`/api/portal/${houseSlug}/communities/${communitySlug}/members?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setMembers(data.members)
        setTotalPages(Math.ceil(data.total / 20))
        setCurrentUserRole(data.currentUserRole)
        setPendingCount(data.pendingRequestsCount || 0)
      }
    } catch (error) {
      console.error('Failed to fetch members:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/portal/${houseSlug}/communities/${communitySlug}/members/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      })
      
      const data = await response.json()
      if (data.success) {
        fetchMembers()
      } else {
        alert(data.error || 'Failed to update role')
      }
    } catch (error) {
      console.error('Failed to update role:', error)
      alert('An error occurred')
    }
    setShowActionMenu(null)
  }

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from the community?`)) return
    
    try {
      const response = await fetch(`/api/portal/${houseSlug}/communities/${communitySlug}/members/${memberId}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      if (data.success) {
        fetchMembers()
      } else {
        alert(data.error || 'Failed to remove member')
      }
    } catch (error) {
      console.error('Failed to remove member:', error)
      alert('An error occurred')
    }
    setShowActionMenu(null)
  }

  const handleApproveMember = async (memberId: string) => {
    try {
      const response = await fetch(`/api/portal/${houseSlug}/communities/${communitySlug}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, action: 'approve' })
      })
      
      const data = await response.json()
      if (data.success) {
        fetchMembers()
      } else {
        alert(data.error || 'Failed to approve member')
      }
    } catch (error) {
      console.error('Failed to approve member:', error)
      alert('An error occurred')
    }
  }

  const handleRejectMember = async (memberId: string) => {
    if (!confirm('Reject this join request?')) return
    
    try {
      const response = await fetch(`/api/portal/${houseSlug}/communities/${communitySlug}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, action: 'reject' })
      })
      
      const data = await response.json()
      if (data.success) {
        fetchMembers()
      } else {
        alert(data.error || 'Failed to reject member')
      }
    } catch (error) {
      console.error('Failed to reject member:', error)
      alert('An error occurred')
    }
  }

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const canManageRoles = ['OWNER', 'ADMIN'].includes(currentUserRole)
  const isOwner = currentUserRole === 'OWNER'
  const showPendingTab = ['OWNER', 'ADMIN', 'MODERATOR'].includes(currentUserRole)

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Community Members</h1>
        <p className="text-gray-600 mt-1">Manage and connect with community members</p>
      </div>
      
      {/* Stats Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-2xl font-bold text-gray-900">{members.length}</span>
              <span className="text-gray-600 ml-1">Total Members</span>
            </div>
            {showPendingTab && pendingCount > 0 && (
              <div className="flex items-center gap-2 text-yellow-600">
                <Clock className="h-5 w-5" />
                <span className="font-medium">{pendingCount} Pending Requests</span>
              </div>
            )}
          </div>
          
          {/* Search and Filter */}
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm w-64"
              />
            </div>
            
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              <Filter className="h-4 w-4" />
              Filter
            </button>
          </div>
        </div>
        
        {/* Filter Panel */}
        {showFilter && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex gap-4">
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Roles</option>
              <option value="OWNER">Owner</option>
              <option value="ADMIN">Admin</option>
              <option value="MODERATOR">Moderator</option>
              <option value="MEMBER">Member</option>
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
        )}
      </div>
      
      {/* Members List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-200">
              {filteredMembers.map((member) => (
                <div key={member.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                        {member.image ? (
                          <img src={member.image} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="text-white text-base font-medium">
                            {member.name?.[0] || member.email?.[0] || 'M'}
                          </span>
                        )}
                      </div>
                      
                      {/* Info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">{member.name}</h3>
                          {member.role === 'OWNER' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                              <Crown className="h-3 w-3" />
                              Owner
                            </span>
                          )}
                          {member.role === 'ADMIN' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                              <Shield className="h-3 w-3" />
                              Admin
                            </span>
                          )}
                          {member.role === 'MODERATOR' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                              <Shield className="h-3 w-3" />
                              Moderator
                            </span>
                          )}
                          {member.status === 'PENDING' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                              <Clock className="h-3 w-3" />
                              Pending Approval
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{member.email}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Joined {new Date(member.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {member.status === 'PENDING' && canManageRoles && (
                        <>
                          <button
                            onClick={() => handleApproveMember(member.id)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="Approve"
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleRejectMember(member.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Reject"
                          >
                            <XCircle className="h-5 w-5" />
                          </button>
                        </>
                      )}
                      
                      {canManageRoles && member.status === 'ACTIVE' && member.role !== 'OWNER' && (
                        <div className="relative">
                          <button
                            onClick={() => setShowActionMenu(showActionMenu === member.id ? null : member.id)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                          >
                            <MoreVertical className="h-5 w-5" />
                          </button>
                          
                          {showActionMenu === member.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setShowActionMenu(null)} />
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                                {isOwner && (
                                  <>
                                    <button
                                      onClick={() => handleUpdateRole(member.id, 'ADMIN')}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                      <Shield className="inline h-4 w-4 mr-2" />
                                      Make Admin
                                    </button>
                                    <button
                                      onClick={() => handleUpdateRole(member.id, 'MODERATOR')}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                      <Shield className="inline h-4 w-4 mr-2" />
                                      Make Moderator
                                    </button>
                                    <button
                                      onClick={() => handleUpdateRole(member.id, 'MEMBER')}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                      <UserCog className="inline h-4 w-4 mr-2" />
                                      Demote to Member
                                    </button>
                                    <div className="border-t border-gray-100 my-1" />
                                  </>
                                )}
                                <button
                                  onClick={() => handleRemoveMember(member.id, member.name)}
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  <UserMinus className="inline h-4 w-4 mr-2" />
                                  Remove from Community
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}