"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Textarea } from "@/components/ui/Textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select"
import { Switch } from "@/components/ui/Switch"
import { Label } from "@/components/ui/Label"

const ticketSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  type: z.enum(["GENERAL_ADMISSION", "VIP", "EARLY_BIRD", "GROUP", "SEASON_PASS", "WORKSHOP", "COURSE", "DONATION", "CUSTOM"]),
  price: z.number().min(0, "Price must be 0 or greater"),
  currency: z.string().default("USD"),
  totalQuantity: z.number().int().positive("Total quantity must be positive"),
  maxPerPurchase: z.number().int().positive().default(10),
  memberOnly: z.boolean().default(false),
  salesStartAt: z.string(),
  salesEndAt: z.string(),
  validFrom: z.string(),
  validUntil: z.string(),
  isPublic: z.boolean().default(true),
  earlyBirdPrice: z.number().optional(),
  memberPrice: z.number().optional(),
})

type TicketFormData = z.infer<typeof ticketSchema>

interface TicketFormProps {
  initialData?: Partial<TicketFormData> & { id?: string }
  onSubmit: (data: TicketFormData) => Promise<void>
  isLoading?: boolean
}

export function TicketForm({ initialData, onSubmit, isLoading = false }: TicketFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      type: initialData?.type || "GENERAL_ADMISSION",
      price: initialData?.price || 0,
      currency: initialData?.currency || "USD",
      totalQuantity: initialData?.totalQuantity || 100,
      maxPerPurchase: initialData?.maxPerPurchase || 10,
      memberOnly: initialData?.memberOnly || false,
      salesStartAt: initialData?.salesStartAt || new Date().toISOString().slice(0, 16),
      salesEndAt: initialData?.salesEndAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      validFrom: initialData?.validFrom || new Date().toISOString().slice(0, 16),
      validUntil: initialData?.validUntil || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      isPublic: initialData?.isPublic !== false,
      earlyBirdPrice: initialData?.earlyBirdPrice,
      memberPrice: initialData?.memberPrice,
    },
  })

  const memberOnly = watch("memberOnly")

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Ticket Name *</Label>
          <Input id="name" {...register("name")} />
          {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Ticket Type</Label>
          <Select
            defaultValue={initialData?.type || "GENERAL_ADMISSION"}
            onValueChange={(value) => setValue("type", value as any)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GENERAL_ADMISSION">General Admission</SelectItem>
              <SelectItem value="VIP">VIP</SelectItem>
              <SelectItem value="EARLY_BIRD">Early Bird</SelectItem>
              <SelectItem value="GROUP">Group</SelectItem>
              <SelectItem value="SEASON_PASS">Season Pass</SelectItem>
              <SelectItem value="WORKSHOP">Workshop</SelectItem>
              <SelectItem value="COURSE">Course</SelectItem>
              <SelectItem value="DONATION">Donation</SelectItem>
              <SelectItem value="CUSTOM">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...register("description")} rows={3} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="price">Price *</Label>
          <Input id="price" type="number" step="0.01" {...register("price", { valueAsNumber: true })} />
          {errors.price && <p className="text-sm text-red-500">{errors.price.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="memberPrice">Member Price</Label>
          <Input id="memberPrice" type="number" step="0.01" {...register("memberPrice", { valueAsNumber: true })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="earlyBirdPrice">Early Bird Price</Label>
          <Input id="earlyBirdPrice" type="number" step="0.01" {...register("earlyBirdPrice", { valueAsNumber: true })} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="totalQuantity">Total Quantity *</Label>
          <Input id="totalQuantity" type="number" {...register("totalQuantity", { valueAsNumber: true })} />
          {errors.totalQuantity && <p className="text-sm text-red-500">{errors.totalQuantity.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxPerPurchase">Max Per Purchase</Label>
          <Input id="maxPerPurchase" type="number" {...register("maxPerPurchase", { valueAsNumber: true })} />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch 
          id="memberOnly" 
          checked={memberOnly} 
          onCheckedChange={(checked) => setValue("memberOnly", checked)} 
        />
        <Label htmlFor="memberOnly">Members Only</Label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="salesStartAt">Sales Start Date *</Label>
          <Input id="salesStartAt" type="datetime-local" {...register("salesStartAt")} />
          {errors.salesStartAt && <p className="text-sm text-red-500">{errors.salesStartAt.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="salesEndAt">Sales End Date *</Label>
          <Input id="salesEndAt" type="datetime-local" {...register("salesEndAt")} />
          {errors.salesEndAt && <p className="text-sm text-red-500">{errors.salesEndAt.message}</p>}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="validFrom">Valid From *</Label>
          <Input id="validFrom" type="datetime-local" {...register("validFrom")} />
          {errors.validFrom && <p className="text-sm text-red-500">{errors.validFrom.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="validUntil">Valid Until *</Label>
          <Input id="validUntil" type="datetime-local" {...register("validUntil")} />
          {errors.validUntil && <p className="text-sm text-red-500">{errors.validUntil.message}</p>}
        </div>
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Saving..." : initialData?.id ? "Update Ticket" : "Create Ticket"}
      </Button>
    </form>
  )
}