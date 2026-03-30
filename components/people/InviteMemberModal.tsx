"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select"
import { toast } from "sonner"

const inviteSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["MEMBER", "ORG_ADMIN"]).default("MEMBER"),
})

type InviteFormData = z.infer<typeof inviteSchema>

interface InviteMemberModalProps {
  isOpen: boolean
  onClose: () => void
  onInvite: (data: InviteFormData) => Promise<void>
  isLoading?: boolean
}

export function InviteMemberModal({ isOpen, onClose, onInvite, isLoading = false }: InviteMemberModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      role: "MEMBER",
    },
  })

  const onSubmit = async (data: InviteFormData) => {
    try {
      await onInvite(data)
      reset()
      onClose()
      toast.success("Invitation sent successfully!")
    } catch (error) {
      toast.error("Failed to send invitation")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Member</DialogTitle>
          <DialogDescription>
            Send an invitation to join this organization. The member will receive an email with instructions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="member@example.com"
              {...register("email")}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              defaultValue="MEMBER"
              onValueChange={(value) => setValue("role", value as "MEMBER" | "ORG_ADMIN")}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">Member</SelectItem>
                <SelectItem value="ORG_ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Admins can manage members, create houses, and access settings.
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Sending..." : "Send Invitation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}