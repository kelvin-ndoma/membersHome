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
import { Switch } from "@/components/ui/Switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { toast } from "sonner"
import { Home, Loader2, RefreshCw } from "lucide-react"

const editHouseSchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  slug: z.string()
    .min(3, "Slug must be at least 3 characters")
    .max(50, "Slug must be less than 50 characters")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  isPrivate: z.boolean().default(false),
})

type EditHouseData = z.infer<typeof editHouseSchema>

export default function EditHousePage() {
  const router = useRouter()
  const params = useParams()
  const orgId = params.orgId as string
  const houseId = params.houseId as string
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<EditHouseData>({
    resolver: zodResolver(editHouseSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      isPrivate: false,
    },
  })

  const name = watch("name")
  const slug = watch("slug")

  useEffect(() => {
    const fetchHouse = async () => {
      try {
        const res = await fetch(`/api/admin/organizations/${orgId}/houses/${houseId}`)
        if (!res.ok) throw new Error("Failed to fetch house")
        const data = await res.json()
        
        reset({
          name: data.name,
          slug: data.slug,
          description: data.description || "",
          isPrivate: data.isPrivate,
        })
      } catch (error) {
        console.error("Error fetching house:", error)
        toast.error("Failed to load house data")
        router.push(`/admin/organizations/${orgId}`)
      } finally {
        setIsLoadingData(false)
      }
    }

    fetchHouse()
  }, [orgId, houseId, reset, router])

  const generateSlug = () => {
    const generatedSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
    if (generatedSlug) {
      setValue("slug", generatedSlug)
    }
  }

  const onSubmit = async (data: EditHouseData) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}/houses/${houseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to update house")
      }

      toast.success(`House "${data.name}" updated successfully!`)
      router.push(`/admin/organizations/${orgId}`)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingData) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-2xl py-12 px-4">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Home className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Edit House</CardTitle>
          <CardDescription>
            Update house details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">House Name *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="e.g., Leadership Team, Marketing Department"
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
                This will be displayed to members
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">House URL Slug *</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="flex items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                      <span className="text-muted-foreground whitespace-nowrap">
                        house/
                      </span>
                      <Input
                        id="slug"
                        {...register("slug")}
                        placeholder="your-house"
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
                This is the unique URL for this house. Use only lowercase letters, numbers, and hyphens.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Describe the purpose of this house..."
                rows={4}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isPrivate"
                checked={watch("isPrivate")}
                onCheckedChange={(checked) => setValue("isPrivate", checked)}
              />
              <Label htmlFor="isPrivate">Private House</Label>
            </div>
            <p className="text-xs text-muted-foreground -mt-2">
              Private houses are hidden from non-members and require invitation to join.
            </p>

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
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}