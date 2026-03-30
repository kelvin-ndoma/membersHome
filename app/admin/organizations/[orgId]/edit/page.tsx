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
import { Loader2, Building2, Globe, Mail, Palette } from "lucide-react"

const editOrgSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  plan: z.enum(["FREE", "STARTER", "PROFESSIONAL", "ENTERPRISE"]),
  status: z.enum(["ACTIVE", "SUSPENDED", "CANCELLED", "TRIAL"]),
  billingEmail: z.string().email().optional().or(z.literal("")),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  customDomain: z.string().optional(),
})

type EditOrgData = z.infer<typeof editOrgSchema>

export default function EditOrganizationPage() {
  const router = useRouter()
  const params = useParams()
  const orgId = params.orgId as string
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [activeTab, setActiveTab] = useState("general")

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<EditOrgData>({
    resolver: zodResolver(editOrgSchema),
    defaultValues: {
      name: "",
      description: "",
      website: "",
      plan: "FREE",
      status: "ACTIVE",
      billingEmail: "",
      primaryColor: "#3B82F6",
      secondaryColor: "#1E40AF",
      customDomain: "",
    },
  })

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const res = await fetch(`/api/admin/organizations/${orgId}`)
        if (!res.ok) throw new Error("Failed to fetch organization")
        
        const data = await res.json()
        
        reset({
          name: data.name,
          description: data.description || "",
          website: data.website || "",
          plan: data.plan,
          status: data.status,
          billingEmail: data.billingEmail || "",
          primaryColor: data.primaryColor || "#3B82F6",
          secondaryColor: data.secondaryColor || "#1E40AF",
          customDomain: data.customDomain || "",
        })
      } catch (error) {
        console.error("Error fetching organization:", error)
        toast.error("Failed to load organization data")
        router.push("/admin/organizations")
      } finally {
        setIsLoadingData(false)
      }
    }

    fetchOrganization()
  }, [orgId, reset, router])

  const onSubmit = async (data: EditOrgData) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to update organization")
      }

      toast.success("Organization updated successfully")
      router.push(`/admin/organizations/${orgId}`)
      router.refresh()
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
    <div className="mx-auto max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Edit Organization</CardTitle>
          <CardDescription>
            Update organization details and settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                General
              </TabsTrigger>
              <TabsTrigger value="branding" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Branding
              </TabsTrigger>
              <TabsTrigger value="billing" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Billing
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <TabsContent value="general" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Organization Name *</Label>
                  <Input id="name" {...register("name")} />
                  {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" {...register("description")} rows={3} />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="website" {...register("website")} placeholder="https://example.com" className="pl-9" />
                    </div>
                    {errors.website && <p className="text-sm text-red-500">{errors.website.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customDomain">Custom Domain</Label>
                    <Input id="customDomain" {...register("customDomain")} placeholder="members.yourdomain.com" />
                  </div>
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
                    <Label htmlFor="status">Status</Label>
                    <Select
                      defaultValue="ACTIVE"
                      onValueChange={(value) => setValue("status", value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="SUSPENDED">Suspended</SelectItem>
                        <SelectItem value="CANCELLED">Deleted</SelectItem>
                        <SelectItem value="TRIAL">Trial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="branding" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primaryColor"
                        type="color"
                        {...register("primaryColor")}
                        className="w-16 h-10"
                      />
                      <Input
                        type="text"
                        {...register("primaryColor")}
                        placeholder="#3B82F6"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secondaryColor">Secondary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="secondaryColor"
                        type="color"
                        {...register("secondaryColor")}
                        className="w-16 h-10"
                      />
                      <Input
                        type="text"
                        {...register("secondaryColor")}
                        placeholder="#1E40AF"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm text-muted-foreground">
                    These colors will be used throughout the organization's dashboard and public pages.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="billing" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="billingEmail">Billing Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="billingEmail"
                      type="email"
                      {...register("billingEmail")}
                      placeholder="billing@example.com"
                      className="pl-9"
                    />
                  </div>
                  {errors.billingEmail && <p className="text-sm text-red-500">{errors.billingEmail.message}</p>}
                  <p className="text-xs text-muted-foreground">
                    Invoices and billing notifications will be sent to this email.
                  </p>
                </div>

                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm text-muted-foreground">
                    Stripe customer ID: {localStorage ? "Not connected" : "Loading..."}
                  </p>
                </div>
              </TabsContent>

              <div className="flex gap-4 pt-4 border-t">
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
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}