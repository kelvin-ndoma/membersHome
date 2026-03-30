"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { toast } from "sonner"
import { Mail, UserPlus } from "lucide-react"

const inviteSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["MEMBER", "ORG_ADMIN"]).default("MEMBER"),
})

type InviteFormData = z.infer<typeof inviteSchema>

export default function InviteMemberPage() {
  const router = useRouter()
  const params = useParams()
  const orgSlug = params.orgSlug as string
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
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
    setIsLoading(true)
    try {
      const res = await fetch(`/api/organizations/${orgSlug}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to send invitation")
      }

      toast.success("Invitation sent successfully!")
      router.push(`/organization/${orgSlug}/people`)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <UserPlus className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Invite Member</CardTitle>
          <CardDescription>
            Send an invitation to join your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="member@example.com"
                  className="pl-9"
                  {...register("email")}
                  disabled={isLoading}
                />
              </div>
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
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

            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="text-muted-foreground">
                The member will receive an email with instructions to join.
                Invitations expire after 7 days.
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? "Sending..." : "Send Invitation"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}