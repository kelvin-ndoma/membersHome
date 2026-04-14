// components/house/settings/TeamSettings.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { 
  UserPlus, 
  Mail,
  Users, 
  User, 
  MoreVertical,
  Crown,
  Star,
  User as UserIcon,
  X,
  CheckCircle,
  Clock,
} from 'lucide-react'

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['HOUSE_MANAGER', 'HOUSE_ADMIN', 'HOUSE_STAFF']),
})

type InviteForm = z.infer<typeof inviteSchema>

interface TeamMember {
  id: string
  userId: string
  name: string
  email: string
  image: string | null
  role: string
  status: string
  joinedAt: Date
}

interface TeamSettingsProps {
  orgSlug: string
  houseSlug: string
  houseId: string
  houseName: string
  organizationId: string
  organizationName: string
  currentMembers: TeamMember[]
  isOwner?: boolean
}

const roleConfig = {
  HOUSE_MANAGER: {
    label: 'Manager',
    description: 'Full access to manage house, events, members, and settings',
    icon: Crown,
    color: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  HOUSE_ADMIN: {
    label: 'Admin',
    description: 'Can manage events, tickets, and members',
    icon: Star,
    color: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  HOUSE_STAFF: {
    label: 'Staff',
    description: 'Can check in attendees and validate tickets',
    icon: UserIcon,
    color: 'bg-green-100 text-green-800 border-green-300',
  },
}

export default function TeamSettings({ 
  orgSlug, 
  houseSlug, 
  houseId,
  houseName,
  organizationId,
  organizationName,
  currentMembers,
  isOwner = false
}: TeamSettingsProps) {
  const router = useRouter()
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<'HOUSE_MANAGER' | 'HOUSE_ADMIN' | 'HOUSE_STAFF'>('HOUSE_STAFF')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      role: 'HOUSE_STAFF',
    }
  })

  const onSubmit = async (data: InviteForm) => {
    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/org/${orgSlug}/houses/${houseSlug}/members/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          houseId,
          houseName,
          organizationId,
          organizationName,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Failed to send invitation')
        return
      }

      toast.success(`Invitation sent to ${data.email}`)
      reset()
      setIsInviteModalOpen(false)
      router.refresh()
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return
    
    try {
      const response = await fetch(`/api/org/${orgSlug}/houses/${houseSlug}/members/${memberId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const result = await response.json()
        toast.error(result.error || 'Failed to remove member')
        return
      }

      toast.success('Team member removed')
      setOpenMenuId(null)
      router.refresh()
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/org/${orgSlug}/houses/${houseSlug}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) {
        const result = await response.json()
        toast.error(result.error || 'Failed to update role')
        return
      }

      toast.success('Role updated')
      setOpenMenuId(null)
      router.refresh()
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const handleResendInvite = async (memberId: string, email: string) => {
    try {
      const response = await fetch(`/api/org/${orgSlug}/houses/${houseSlug}/members/${memberId}/resend-invite`, {
        method: 'POST',
      })

      if (!response.ok) {
        const result = await response.json()
        toast.error(result.error || 'Failed to resend invitation')
        return
      }

      toast.success(`Invitation resent to ${email}`)
      setOpenMenuId(null)
      router.refresh()
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const canManageMember = (member: TeamMember) => {
    if (isOwner) return true
    return member.role === 'HOUSE_STAFF'
  }

  return (
    <div className="space-y-6">
      {/* Current Team Members */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900">Current Team Members</h3>
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
          >
            <UserPlus className="h-4 w-4" />
            Invite Team Member
          </button>
        </div>

        {currentMembers.length === 0 ? (
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No team members yet</p>
            <p className="text-sm text-gray-400 mt-1">Invite managers or staff to help run your house</p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentMembers.map((member) => {
              const config = roleConfig[member.role as keyof typeof roleConfig] || roleConfig.HOUSE_STAFF
              const RoleIcon = config.icon
              const canManage = canManageMember(member)
              
              return (
                <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      {member.image ? (
                        <img src={member.image} alt="" className="w-10 h-10 rounded-full" />
                      ) : (
                        <User className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{member.name}</p>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${config.color}`}>
                        <RoleIcon className="h-3 w-3" />
                        {config.label}
                      </span>
                      {member.status === 'PENDING' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                          <Clock className="h-3 w-3" />
                          Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          <CheckCircle className="h-3 w-3" />
                          Active
                        </span>
                      )}
                    </div>
                    
                    {canManage && (
                      <div className="relative">
                        <button 
                          onClick={() => setOpenMenuId(openMenuId === member.id ? null : member.id)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        
                        {openMenuId === member.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                              <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-100">
                                Change Role
                              </div>
                              {Object.entries(roleConfig).map(([role, config]) => (
                                <button
                                  key={role}
                                  onClick={() => handleRoleChange(member.id, role)}
                                  disabled={member.role === role}
                                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                  <config.icon className="h-4 w-4" />
                                  {config.label}
                                </button>
                              ))}
                              
                              {member.status === 'PENDING' && (
                                <>
                                  <div className="border-t border-gray-100 my-1" />
                                  <button
                                    onClick={() => handleResendInvite(member.id, member.email)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50"
                                  >
                                    <Mail className="h-4 w-4" />
                                    Resend Invitation
                                  </button>
                                </>
                              )}
                              
                              <div className="border-t border-gray-100 my-1" />
                              <button
                                onClick={() => handleRemoveMember(member.id)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                <X className="h-4 w-4" />
                                Remove
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Role Explanations */}
      <div className="border-t border-gray-100 pt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Role Permissions</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(roleConfig).map(([role, config]) => (
            <div key={role} className={`p-4 rounded-lg border ${config.color}`}>
              <div className="flex items-center gap-2 mb-2">
                <config.icon className="h-5 w-5" />
                <span className="font-medium">{config.label}</span>
              </div>
              <p className="text-xs">{config.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/30" onClick={() => setIsInviteModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Invite Team Member</h3>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    {...register('name')}
                    type="text"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="John Doe"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    {...register('email')}
                    type="email"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="john@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Role *
                </label>
                <div className="space-y-2">
                  {Object.entries(roleConfig).map(([role, config]) => (
                    <label
                      key={role}
                      className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${
                        selectedRole === role 
                          ? config.color + ' border-current' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        {...register('role')}
                        value={role}
                        checked={selectedRole === role}
                        onChange={() => setSelectedRole(role as any)}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <config.icon className="h-4 w-4" />
                          <span className="font-medium text-gray-900">{config.label}</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5">{config.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}