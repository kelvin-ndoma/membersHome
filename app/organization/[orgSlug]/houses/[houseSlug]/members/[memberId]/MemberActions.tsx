// app/organization/[orgSlug]/houses/[houseSlug]/members/[memberId]/MemberActions.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/Dropdown"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog"
import { Label } from "@/components/ui/Label"
import { Input } from "@/components/ui/Input"
import { Textarea } from "@/components/ui/Textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select"
import { 
  MoreVertical, 
  Shield, 
  Mail, 
  Ban, 
  MessageSquare,
  Loader2
} from "lucide-react"
import { toast } from "sonner"

interface MemberActionsProps {
  memberId: string  // This is the houseMembershipId
  currentRole: string
  currentStaffPosition?: string | null
  currentManagerLevel?: number | null
  memberName: string
  memberEmail: string
  orgSlug: string
  houseSlug: string
}

export function MemberActions({ 
  memberId, 
  currentRole,
  currentStaffPosition,
  currentManagerLevel,
  memberName,
  memberEmail,
  orgSlug,
  houseSlug
}: MemberActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showRoleDialog, setShowRoleDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showMessageDialog, setShowMessageDialog] = useState(false)
  const [selectedRole, setSelectedRole] = useState(currentRole)
  const [staffPosition, setStaffPosition] = useState(currentStaffPosition || "")
  const [managerLevel, setManagerLevel] = useState<number>(currentManagerLevel || 1)
  const [cancellationReason, setCancellationReason] = useState("")
  const [messageSubject, setMessageSubject] = useState("")
  const [messageBody, setMessageBody] = useState("")

  // Reset form when dialog opens
  useEffect(() => {
    if (showRoleDialog) {
      setSelectedRole(currentRole)
      setStaffPosition(currentStaffPosition || "")
      setManagerLevel(currentManagerLevel || 1)
    }
  }, [showRoleDialog, currentRole, currentStaffPosition, currentManagerLevel])

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role)
    // Reset staff position and manager level when role changes
    if (role !== "HOUSE_STAFF") {
      setStaffPosition("")
    }
    if (role !== "HOUSE_MANAGER") {
      setManagerLevel(1)
    }
  }

  const handleRoleChange = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/organizations/${orgSlug}/houses/${houseSlug}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          role: selectedRole,
          staffPosition: selectedRole === "HOUSE_STAFF" ? staffPosition : null,
          managerLevel: selectedRole === "HOUSE_MANAGER" ? managerLevel : null
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to update role")
      }

      toast.success(`Role updated to ${selectedRole.replace("HOUSE_", "")}`)
      router.refresh()
      setShowRoleDialog(false)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelMembership = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/organizations/${orgSlug}/houses/${houseSlug}/members/${memberId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancellationReason }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to cancel membership")
      }

      toast.success("Membership cancelled successfully")
      router.push(`/organization/${orgSlug}/houses/${houseSlug}/members`)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!messageSubject.trim() || !messageBody.trim()) {
      toast.error("Please enter both subject and message")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(`/api/organizations/${orgSlug}/houses/${houseSlug}/members/${memberId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          subject: messageSubject, 
          message: messageBody 
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to send message")
      }

      toast.success("Message sent successfully")
      setShowMessageDialog(false)
      setMessageSubject("")
      setMessageBody("")
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowRoleDialog(true)}>
            <Shield className="mr-2 h-4 w-4" />
            Change Role
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowMessageDialog(true)}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Send Message
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={`mailto:${memberEmail}`}>
              <Mail className="mr-2 h-4 w-4" />
              Send Email
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => setShowCancelDialog(true)}
            className="text-red-600 focus:text-red-600"
          >
            <Ban className="mr-2 h-4 w-4" />
            Cancel Membership
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Change Role Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Member Role</DialogTitle>
            <DialogDescription>
              Update the role for {memberName} in this house.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={selectedRole} onValueChange={handleRoleSelect}>
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
            {selectedRole === "HOUSE_STAFF" && (
              <div className="space-y-2">
                <Label>Staff Position</Label>
                <Input
                  placeholder="e.g., Event Coordinator, Marketing Lead"
                  value={staffPosition}
                  onChange={(e) => setStaffPosition(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Specify the staff member's role</p>
              </div>
            )}
            {selectedRole === "HOUSE_MANAGER" && (
              <div className="space-y-2">
                <Label>Manager Level</Label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={managerLevel}
                  onChange={(e) => setManagerLevel(parseInt(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">Level 1 = Junior Manager, Level 5 = Senior Manager</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRoleChange} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Membership Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Membership</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel {memberName}'s membership? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason for Cancellation (Optional)</Label>
              <Textarea
                placeholder="Please provide a reason..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleCancelMembership} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm Cancellation"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Message Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Message</DialogTitle>
            <DialogDescription>
              Send a message to {memberName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                placeholder="Message subject..."
                value={messageSubject}
                onChange={(e) => setMessageSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                placeholder="Write your message here..."
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMessageDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendMessage} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Message"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}