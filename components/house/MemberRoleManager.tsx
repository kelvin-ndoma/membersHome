"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select"
import { toast } from "sonner"

interface Member {
  id: string
  user: {
    id: string
    name: string
    email: string
  }
  role: "HOUSE_MEMBER" | "HOUSE_STAFF" | "HOUSE_MANAGER" | "HOUSE_ADMIN"
  staffPosition?: string | null
  managerLevel?: number | null
}

interface MemberRoleManagerProps {
  members: Member[]
  currentUserRole: string
  onRoleUpdate: (memberId: string, newRole: string, staffPosition?: string, managerLevel?: number) => Promise<void>
  orgSlug: string
  houseSlug: string
}

const roleOptions = [
  { value: "HOUSE_MEMBER", label: "Member" },
  { value: "HOUSE_STAFF", label: "Staff" },
  { value: "HOUSE_MANAGER", label: "Manager" },
  { value: "HOUSE_ADMIN", label: "Admin" },
]

export function MemberRoleManager({ 
  members, 
  currentUserRole, 
  onRoleUpdate,
  orgSlug,
  houseSlug 
}: MemberRoleManagerProps) {
  const [updating, setUpdating] = useState<string | null>(null)

  const canManageRole = (targetRole: string) => {
    const roleHierarchy: Record<string, number> = {
      HOUSE_MEMBER: 1,
      HOUSE_STAFF: 2,
      HOUSE_MANAGER: 3,
      HOUSE_ADMIN: 4,
    }
    
    const currentLevel = roleHierarchy[currentUserRole]
    const targetLevel = roleHierarchy[targetRole]
    
    return currentLevel > targetLevel
  }

  const handleRoleChange = async (memberId: string, newRole: string) => {
    setUpdating(memberId)
    try {
      await onRoleUpdate(memberId, newRole)
      toast.success("Role updated successfully")
    } catch (error) {
      toast.error("Failed to update role")
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="p-3 text-left text-sm font-medium">Name</th>
              <th className="p-3 text-left text-sm font-medium">Email</th>
              <th className="p-3 text-left text-sm font-medium">Role</th>
              <th className="p-3 text-left text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} className="border-t">
                <td className="p-3 text-sm">{member.user.name}</td>
                <td className="p-3 text-sm text-muted-foreground">{member.user.email}</td>
                <td className="p-3 text-sm">
                  <span className="inline-flex rounded-full bg-primary/10 px-2 py-1 text-xs">
                    {roleOptions.find(r => r.value === member.role)?.label}
                  </span>
                </td>
                <td className="p-3 text-sm">
                  {canManageRole(member.role) && currentUserRole !== member.role && (
                    <Select
                      value={member.role}
                      onValueChange={(value) => handleRoleChange(member.id, value)}
                      disabled={updating === member.id}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}