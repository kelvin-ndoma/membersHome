"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Textarea } from "@/components/ui/Textarea"
import { Label } from "@/components/ui/Label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Building2, Mail, User, Phone } from "lucide-react"
import { toast } from "sonner"

const enrollSchema = z.object({
  title: z.string().optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, "Please enter a valid phone number").optional(),
})

type EnrollFormData = z.infer<typeof enrollSchema>

interface EnrollFormProps {
  organizationName: string
  organizationLogo?: string | null
  onSubmit: (data: EnrollFormData) => Promise<void>
  isLoading?: boolean
}

export function EnrollForm({ organizationName, organizationLogo, onSubmit, isLoading = false }: EnrollFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EnrollFormData>({
    resolver: zodResolver(enrollSchema),
  })

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          {organizationLogo ? (
            <img src={organizationLogo} alt={organizationName} className="h-12 w-12 rounded-full" />
          ) : (
            <Building2 className="h-8 w-8 text-primary" />
          )}
        </div>
        <CardTitle className="text-2xl">Join {organizationName}</CardTitle>
        <CardDescription>
          Complete your profile to become a member
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title (Optional)</Label>
            <Input
              id="title"
              placeholder="e.g., Marketing Director, Volunteer"
              {...register("title")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number (Optional)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 234 567 8900"
              {...register("phone")}
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio (Optional)</Label>
            <Textarea
              id="bio"
              placeholder="Tell us a little about yourself..."
              rows={4}
              {...register("bio")}
            />
            {errors.bio && (
              <p className="text-sm text-red-500">{errors.bio.message}</p>
            )}
          </div>

          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">
              By joining this organization, you agree to abide by the community guidelines
              and terms of service.
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Joining..." : "Join Organization"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}