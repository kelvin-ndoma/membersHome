"use client"

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
import { Switch } from "@/components/ui/Switch"

const eventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  timezone: z.string().default("UTC"),
  location: z.string().optional(),
  onlineUrl: z.string().url().optional().or(z.literal("")),
  type: z.enum(["IN_PERSON", "ONLINE", "HYBRID"]),
  isFree: z.boolean().default(true),
  capacity: z.number().int().positive().optional().nullable(),
  price: z.number().min(0).optional().nullable(),
  houseId: z.string().optional(),
})

type EventFormData = z.infer<typeof eventSchema>

interface EventFormProps {
  houses?: Array<{ id: string; name: string }>
  initialData?: Partial<EventFormData> & { id?: string }
  onSubmit: (data: EventFormData) => Promise<void>
  isLoading?: boolean
}

export function EventForm({ houses = [], initialData, onSubmit, isLoading = false }: EventFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      startDate: initialData?.startDate || new Date().toISOString().slice(0, 16),
      endDate: initialData?.endDate || new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
      timezone: initialData?.timezone || "UTC",
      location: initialData?.location || "",
      onlineUrl: initialData?.onlineUrl || "",
      type: initialData?.type || "IN_PERSON",
      isFree: initialData?.isFree !== false,
      capacity: initialData?.capacity || null,
      price: initialData?.price || 0,
      houseId: initialData?.houseId || "",
    },
  })

  const eventType = watch("type")
  const isFree = watch("isFree")

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Event Title *</Label>
        <Input id="title" {...register("title")} />
        {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...register("description")} rows={4} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date & Time *</Label>
          <Input id="startDate" type="datetime-local" {...register("startDate")} />
          {errors.startDate && <p className="text-sm text-red-500">{errors.startDate.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End Date & Time *</Label>
          <Input id="endDate" type="datetime-local" {...register("endDate")} />
          {errors.endDate && <p className="text-sm text-red-500">{errors.endDate.message}</p>}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="type">Event Type</Label>
          <Select defaultValue={initialData?.type || "IN_PERSON"} onValueChange={(value) => setValue("type", value as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="IN_PERSON">In Person</SelectItem>
              <SelectItem value="ONLINE">Online</SelectItem>
              <SelectItem value="HYBRID">Hybrid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {houses.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="houseId">House (Optional)</Label>
            <Select onValueChange={(value) => setValue("houseId", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a house" />
              </SelectTrigger>
              <SelectContent>
                {houses.map((house) => (
                  <SelectItem key={house.id} value={house.id}>
                    {house.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {(eventType === "IN_PERSON" || eventType === "HYBRID") && (
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input id="location" {...register("location")} placeholder="Venue address" />
        </div>
      )}

      {(eventType === "ONLINE" || eventType === "HYBRID") && (
        <div className="space-y-2">
          <Label htmlFor="onlineUrl">Online Meeting URL</Label>
          <Input id="onlineUrl" {...register("onlineUrl")} placeholder="https://..." />
          {errors.onlineUrl && <p className="text-sm text-red-500">{errors.onlineUrl.message}</p>}
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Switch
          id="isFree"
          checked={isFree}
          onCheckedChange={(checked) => setValue("isFree", checked)}
        />
        <Label htmlFor="isFree">Free Event</Label>
      </div>

      {!isFree && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="price">Ticket Price</Label>
            <Input id="price" type="number" step="0.01" {...register("price", { valueAsNumber: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="capacity">Capacity (Optional)</Label>
            <Input id="capacity" type="number" {...register("capacity", { valueAsNumber: true })} />
          </div>
        </div>
      )}

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Saving..." : initialData?.id ? "Update Event" : "Create Event"}
      </Button>
    </form>
  )
}