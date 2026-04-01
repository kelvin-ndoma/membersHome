// app/organization/[orgSlug]/houses/[houseSlug]/membership-plans/[planId]/edit/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Textarea } from "@/components/ui/Textarea"
import { Label } from "@/components/ui/Label"
import { Switch } from "@/components/ui/Switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Plus, Trash2, Loader2, ArrowLeft, Home } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

const planSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  type: z.enum(["STANDARD", "PREMIUM", "VIP", "CUSTOM"]),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]),
  billingFrequency: z.enum(["MONTHLY", "QUARTERLY", "SEMI_ANNUAL", "ANNUAL"]),
  amount: z.number().min(0, "Amount must be 0 or greater"),
  currency: z.string().default("USD"),
  vatRate: z.number().min(0).max(100).optional(),
  setupFee: z.number().min(0).optional(),
  features: z.array(z.object({ value: z.string().min(1, "Feature is required") })),
  isPublic: z.boolean().default(true),
  requiresApproval: z.boolean().default(true),
})

type PlanFormData = z.infer<typeof planSchema>

export default function EditMembershipPlanPage() {
  const router = useRouter()
  const params = useParams()
  const orgSlug = params.orgSlug as string
  const houseSlug = params.houseSlug as string
  const planId = params.planId as string
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [house, setHouse] = useState<{ id: string; name: string } | null>(null)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "STANDARD",
      status: "ACTIVE",
      billingFrequency: "MONTHLY",
      amount: 0,
      currency: "USD",
      vatRate: 0,
      setupFee: 0,
      features: [{ value: "" }],
      isPublic: true,
      requiresApproval: true,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "features",
  })

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch house data - this returns the house object directly
        const houseRes = await fetch(`/api/organizations/${orgSlug}/houses/${houseSlug}`)
        if (!houseRes.ok) {
          throw new Error("House not found")
        }
        const houseData = await houseRes.json()
        // The API returns the house object directly (not wrapped in a house property)
        setHouse(houseData)

        // Fetch plan data
        const planRes = await fetch(`/api/organizations/${orgSlug}/membership-plans/${planId}`)
        if (!planRes.ok) {
          throw new Error("Plan not found")
        }
        const planData = await planRes.json()

        reset({
          name: planData.name,
          description: planData.description || "",
          type: planData.type,
          status: planData.status,
          billingFrequency: planData.billingFrequency,
          amount: planData.amount,
          currency: planData.currency,
          vatRate: planData.vatRate || 0,
          setupFee: planData.setupFee || 0,
          features: (planData.features || []).map((f: string) => ({ value: f })),
          isPublic: planData.isPublic,
          requiresApproval: planData.requiresApproval,
        })
      } catch (error) {
        console.error("Failed to fetch data:", error)
        toast.error("Failed to load data")
        router.push(`/organization/${orgSlug}/houses/${houseSlug}/membership-plans`)
      } finally {
        setIsLoadingData(false)
      }
    }

    fetchData()
  }, [orgSlug, houseSlug, planId, reset, router])

  const onSubmit = async (data: PlanFormData) => {
    setIsLoading(true)
    try {
      const formattedData = {
        ...data,
        features: data.features.map(f => f.value).filter(v => v.trim()),
      }

      const res = await fetch(`/api/organizations/${orgSlug}/membership-plans/${planId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formattedData),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to update plan")
      }

      toast.success("Membership plan updated successfully!")
      router.push(`/organization/${orgSlug}/houses/${houseSlug}/membership-plans`)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const formatBillingFrequencyLabel = (freq: string) => {
    const map: Record<string, string> = {
      MONTHLY: "Monthly",
      QUARTERLY: "Quarterly",
      SEMI_ANNUAL: "Semi-Annual",
      ANNUAL: "Annual"
    }
    return map[freq] || freq
  }

  if (isLoadingData) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!house) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-4">
          <Link href={`/organization/${orgSlug}/houses/${houseSlug}/membership-plans`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Membership Plan</h1>
            <p className="text-muted-foreground">
              House not found. Please go back and try again.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-4">
        <Link href={`/organization/${orgSlug}/houses/${houseSlug}/membership-plans`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Membership Plan</h1>
          <p className="text-muted-foreground">
            Update membership tier for {house.name}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plan Details</CardTitle>
          <CardDescription>
            Configure the membership plan settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="rounded-lg bg-muted/50 p-4 mb-4">
              <div className="flex items-center gap-2">
                <Home className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">House</p>
                  <p className="font-medium">{house.name}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Plan Name *</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...register("description")} rows={3} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">Plan Type</Label>
                <Select 
                  value={watch("type")}
                  onValueChange={(value) => setValue("type", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STANDARD">Standard</SelectItem>
                    <SelectItem value="PREMIUM">Premium</SelectItem>
                    <SelectItem value="VIP">VIP</SelectItem>
                    <SelectItem value="CUSTOM">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={watch("status")}
                  onValueChange={(value) => setValue("status", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="billingFrequency">Billing Frequency</Label>
                <Select 
                  value={watch("billingFrequency")}
                  onValueChange={(value) => setValue("billingFrequency", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                    <SelectItem value="SEMI_ANNUAL">Semi-Annual</SelectItem>
                    <SelectItem value="ANNUAL">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  {...register("amount", { valueAsNumber: true })}
                />
                {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="vatRate">VAT Rate (%)</Label>
                <Input
                  id="vatRate"
                  type="number"
                  step="0.01"
                  {...register("vatRate", { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="setupFee">Setup Fee</Label>
                <Input
                  id="setupFee"
                  type="number"
                  step="0.01"
                  {...register("setupFee", { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label>Features Included</Label>
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <Input
                    {...register(`features.${index}.value`)}
                    placeholder="e.g., Access to all events"
                    className="flex-1"
                  />
                  {fields.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ value: "" })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Feature
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isPublic">Public Plan</Label>
                  <p className="text-xs text-muted-foreground">
                    Visible to non-members on the application page
                  </p>
                </div>
                <Switch
                  id="isPublic"
                  checked={watch("isPublic")}
                  onCheckedChange={(checked) => setValue("isPublic", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="requiresApproval">Requires Approval</Label>
                  <p className="text-xs text-muted-foreground">
                    Applications need manual review before approval
                  </p>
                </div>
                <Switch
                  id="requiresApproval"
                  checked={watch("requiresApproval")}
                  onCheckedChange={(checked) => setValue("requiresApproval", checked)}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
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