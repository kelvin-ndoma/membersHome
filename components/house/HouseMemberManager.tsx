"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/Button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select"
import { Label } from "@/components/ui/Label"
import { UserPlus, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Member {
  id: string
  user: {
    id: string
    name: string | null
    email: string
  }
}

interface HouseMemberManagerProps {
  availableMembers: Member[]
  onMemberAdded?: () => void
}

export function HouseMemberManager({ availableMembers, onMemberAdded }: HouseMemberManagerProps) {
  const params = useParams()
  const orgSlug = params.orgSlug as string
  const houseSlug = params.houseSlug as string
  const [open, setOpen] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState("")
  const [selectedRole, setSelectedRole] = useState("HOUSE_MEMBER")
  const [isLoading, setIsLoading] = useState(false)

  const handleAddMember = async () => {
    if (!selectedMemberId) {
      toast.error("Please select a member")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(`/api/organizations/${orgSlug}/houses/${houseSlug}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membershipId: selectedMemberId,
          role: selectedRole,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to add member")
      }

      toast.success("Member added to house successfully")
      setOpen(false)
      setSelectedMemberId("")
      onMemberAdded?.()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (availableMembers.length === 0) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Member to House</DialogTitle>
          <DialogDescription>
            Select an organization member to add to this house.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="member">Select Member</Label>
            <Select onValueChange={setSelectedMemberId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a member" />
              </SelectTrigger>
              <SelectContent>
                {availableMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.user.name || member.user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select defaultValue="HOUSE_MEMBER" onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HOUSE_MEMBER">Member</SelectItem>
                <SelectItem value="HOUSE_STAFF">Staff</SelectItem>
                <SelectItem value="HOUSE_MANAGER">Manager</SelectItem>
                <SelectItem value="HOUSE_ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddMember} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Member"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}