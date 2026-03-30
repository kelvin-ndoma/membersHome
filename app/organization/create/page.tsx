"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Textarea } from "@/components/ui/Textarea"
import { Label } from "@/components/ui/Label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { toast } from "sonner"
import { Building2, Globe, FileText, Loader2, RefreshCw } from "lucide-react"

const createOrgSchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  slug: z.string()
    .min(3, "Slug must be at least 3 characters")
    .max(50, "Slug must be less than 50 characters")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
})

type CreateOrgData = z.infer<typeof createOrgSchema>

export default function CreateOrganizationPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateOrgData>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      website: "",
    },
  })

  const name = watch("name")
  const slug = watch("slug")

  // Check authentication
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
    }
  }, [status, router])

  const generateSlug = () => {
    const generatedSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
    if (generatedSlug) {
      setValue("slug", generatedSlug)
    }
  }

  const onSubmit = async (data: CreateOrgData) => {
    if (!session) {
      toast.error("Please sign in to create an organization")
      router.push("/auth/login")
      return
    }

    setIsLoading(true)
    try {
      console.log("Submitting organization creation...")
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        credentials: "include", // Important: include cookies
        body: JSON.stringify(data),
      })

      const result = await res.json()
      console.log("Response status:", res.status)

      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Please sign in to create an organization")
          router.push("/auth/login")
          return
        }
        throw new Error(result.error || result.message || "Failed to create organization")
      }

      toast.success("Organization created successfully!")
      router.push(`/organization/${result.slug}/dashboard`)
    } catch (error: any) {
      console.error("Error:", error)
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session) {
    return null // Will redirect via useEffect
  }

  return (
    <div className="container mx-auto max-w-2xl py-12 px-4">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Create Your Organization</CardTitle>
          <CardDescription>
            Start managing your community by creating a new organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="e.g., Tech Community, Sports Club"
                onChange={(e) => {
                  register("name").onChange(e)
                  if (!slug) {
                    generateSlug()
                  }
                }}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                This will be displayed to your members
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Organization URL Slug *</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="flex items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                      <span className="text-muted-foreground whitespace-nowrap">
                        membershome.com/organization/
                      </span>
                      <Input
                        id="slug"
                        {...register("slug")}
                        placeholder="your-organization"
                        className="border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>
                  </div>
                  {name && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={generateSlug}
                      disabled={!name}
                      title="Generate from name"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              {errors.slug && (
                <p className="text-sm text-red-500">{errors.slug.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                This is your unique URL. Use only lowercase letters, numbers, and hyphens.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Tell us about your organization..."
                rows={4}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website (Optional)</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="website"
                  {...register("website")}
                  placeholder="https://example.com"
                  className="pl-9"
                />
              </div>
              {errors.website && (
                <p className="text-sm text-red-500">{errors.website.message}</p>
              )}
            </div>

            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">What happens next?</p>
                  <p className="text-muted-foreground">
                    After creating your organization, you'll become the owner. You can then invite members,
                    create houses, and start managing your community.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Organization"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}