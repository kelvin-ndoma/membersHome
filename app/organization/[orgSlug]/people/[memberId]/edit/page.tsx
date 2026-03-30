"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Textarea } from "@/components/ui/Textarea"
import { Label } from "@/components/ui/Label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { toast } from "sonner"
import { Save } from "lucide-react"

const profileSchema = z.object({
  title: z.string().max(100, "Title must be less than 100 characters").optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, "Please enter a valid phone number").optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

export default function EditMemberPage() {
  const router = useRouter()
  const params = useParams()
  const orgSlug = params.orgSlug as string
  const memberId = params.memberId as string
  const [isLoading, setIsLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  })

  useEffect(() => {
    fetch(`/api/organizations/${orgSlug}/members/${memberId}`)
      .then((res) => res.json())
      .then((data) => {
        reset({
          title: data.title || "",
          bio: data.bio || "",
          phone: data.user.phone || "",
        })
        setLoadingData(false)
      })
      .catch((error) => {
        console.error("Failed to load member", error)
        toast.error("Failed to load member data")
        router.push(`/organization/${orgSlug}/people`)
      })
  }, [orgSlug, memberId, reset, router])

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/organizations/${orgSlug}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to update profile")
      }

      toast.success("Profile updated successfully")
      router.push(`/organization/${orgSlug}/people/${memberId}`)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
          <CardDescription>
            Update member profile information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g., Marketing Director, Volunteer"
                {...register("title")}
              />
              {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 234 567 8900"
                {...register("phone")}
              />
              {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
              <p className="text-xs text-muted-foreground">
                Include country code for international numbers
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself..."
                rows={4}
                {...register("bio")}
              />
              {errors.bio && <p className="text-sm text-red-500">{errors.bio.message}</p>}
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
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}