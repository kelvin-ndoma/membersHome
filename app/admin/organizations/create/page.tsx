"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Textarea } from "@/components/ui/Textarea"
import { Label } from "@/components/ui/Label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs"
import { toast } from "sonner"
import { Building2, Globe, FileText, Loader2, RefreshCw, UserPlus, Mail } from "lucide-react"

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
  plan: z.enum(["FREE", "STARTER", "PROFESSIONAL", "ENTERPRISE"]).default("FREE"),
  billingEmail: z.string().email("Must be a valid email").optional().or(z.literal("")),
})

type CreateOrgData = z.infer<typeof createOrgSchema>

interface User {
  id: string
  name: string | null
  email: string
  platformRole: string
}

export default function AdminCreateOrganizationPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [selectedOwnerType, setSelectedOwnerType] = useState<"existing" | "new">("existing")
  const [selectedUserId, setSelectedUserId] = useState("")
  const [ownerEmail, setOwnerEmail] = useState("")
  const [ownerName, setOwnerName] = useState("")

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
      plan: "FREE",
      billingEmail: "",
    },
  })

  const name = watch("name")
  const slug = watch("slug")

  useEffect(() => {
    fetch("/api/admin/users?page=1&pageSize=100")
      .then(res => res.json())
      .then(data => {
        setUsers(data.users || [])
        setLoadingUsers(false)
      })
      .catch(error => {
        console.error("Failed to load users", error)
        setLoadingUsers(false)
      })
  }, [])

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
    setIsLoading(true)
    try {
      // Prepare payload with owner info
      const payload = {
        ...data,
        ownerType: selectedOwnerType,
        ...(selectedOwnerType === "existing" && { ownerUserId: selectedUserId }),
        ...(selectedOwnerType === "new" && { ownerEmail, ownerName }),
      }

      const res = await fetch("/api/admin/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || result.message || "Failed to create organization")
      }

      if (selectedOwnerType === "new") {
        toast.success(`Organization created! An invitation has been sent to ${ownerEmail}.`)
      } else {
        const owner = users.find(u => u.id === selectedUserId)
        toast.success(`Organization created and assigned to ${owner?.name || owner?.email}!`)
      }
      
      router.push(`/admin/organizations/${result.id}`)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (loadingUsers) {
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
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Create Organization (Admin)</CardTitle>
          <CardDescription>
            Create a new organization and assign an owner
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
                This will be displayed to members
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
                This is the unique URL. Use only lowercase letters, numbers, and hyphens.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Organization Owner *</Label>
              <Tabs value={selectedOwnerType} onValueChange={(v) => setSelectedOwnerType(v as "existing" | "new")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="existing" className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Existing User
                  </TabsTrigger>
                  <TabsTrigger value="new" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Invite New User
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="existing" className="mt-4 space-y-2">
                  <Select onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a user to be the owner" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          <div className="flex items-center gap-2">
                            <UserPlus className="h-4 w-4" />
                            <span>{user.name || user.email}</span>
                            {user.platformRole === "PLATFORM_ADMIN" && (
                              <span className="text-xs text-purple-500">(Admin)</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!selectedUserId && (
                    <p className="text-xs text-muted-foreground">
                      Select an existing user to become the organization owner
                    </p>
                  )}
                </TabsContent>
                
                <TabsContent value="new" className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ownerName">Full Name</Label>
                    <Input
                      id="ownerName"
                      placeholder="John Doe"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ownerEmail">Email Address</Label>
                    <Input
                      id="ownerEmail"
                      type="email"
                      placeholder="owner@example.com"
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      An invitation will be sent to this email address
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Tell us about this organization..."
                rows={4}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="plan">Plan</Label>
                <Select
                  defaultValue="FREE"
                  onValueChange={(value) => setValue("plan", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FREE">Free</SelectItem>
                    <SelectItem value="STARTER">Starter ($29/mo)</SelectItem>
                    <SelectItem value="PROFESSIONAL">Professional ($99/mo)</SelectItem>
                    <SelectItem value="ENTERPRISE">Enterprise ($299/mo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="billingEmail">Billing Email</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="billingEmail"
                    {...register("billingEmail")}
                    placeholder="billing@example.com"
                    className="pl-9"
                  />
                </div>
                {errors.billingEmail && (
                  <p className="text-sm text-red-500">{errors.billingEmail.message}</p>
                )}
              </div>
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
                    {selectedOwnerType === "existing" 
                      ? "The selected user will be assigned as the organization owner and can start managing immediately."
                      : "An invitation will be sent to the email address. When the user accepts, they will become the organization owner."}
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
              <Button 
                type="submit" 
                disabled={isLoading || (selectedOwnerType === "existing" && !selectedUserId) || (selectedOwnerType === "new" && (!ownerEmail || !ownerName))} 
                className="flex-1"
              >
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