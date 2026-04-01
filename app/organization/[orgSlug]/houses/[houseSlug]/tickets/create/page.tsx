// app/organization/[orgSlug]/houses/[houseSlug]/tickets/create/page.tsx
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Loader2, ArrowLeft, Home, Calendar } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { format } from "date-fns"

const ticketSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  type: z.enum(["GENERAL_ADMISSION", "VIP", "EARLY_BIRD", "GROUP", "SEASON_PASS", "WORKSHOP", "COURSE", "DONATION", "CUSTOM"]),
  price: z.number().min(0, "Price must be 0 or greater"),
  currency: z.string().default("USD"),
  totalQuantity: z.number().int().positive("Quantity must be at least 1"),
  maxPerPurchase: z.number().int().min(1, "Max per purchase must be at least 1"),
  memberOnly: z.boolean().default(false),
  requiresApproval: z.boolean().default(false),
  salesStartAt: z.string(),
  salesEndAt: z.string(),
  validFrom: z.string(),
  validUntil: z.string(),
  eventId: z.string().optional(),
})

type TicketFormData = z.infer<typeof ticketSchema>

interface Event {
  id: string
  title: string
  startDate: Date
}

export default function CreateTicketPage() {
  const router = useRouter()
  const params = useParams()
  const orgSlug = params.orgSlug as string
  const houseSlug = params.houseSlug as string

  const [isLoading, setIsLoading] = useState(false)
  const [house, setHouse] = useState<{ id: string; name: string } | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [loadingData, setLoadingData] = useState(true)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "GENERAL_ADMISSION",
      price: 0,
      currency: "USD",
      totalQuantity: 100,
      maxPerPurchase: 10,
      memberOnly: false,
      requiresApproval: false,
      salesStartAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      salesEndAt: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"),
      validFrom: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      validUntil: format(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"),
      eventId: "none",
    },
  })

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch house data
        const houseRes = await fetch(`/api/organizations/${orgSlug}/houses/${houseSlug}`)
        if (!houseRes.ok) {
          throw new Error("House not found")
        }
        const houseData = await houseRes.json()
        setHouse(houseData)

        // Fetch events for this house
        const eventsRes = await fetch(`/api/organizations/${orgSlug}/events?houseId=${houseData.id}&status=PUBLISHED`)
        if (eventsRes.ok) {
          const eventsData = await eventsRes.json()
          setEvents(eventsData.events || [])
        }
      } catch (error) {
        console.error("Failed to load data", error)
        toast.error("Failed to load data")
      } finally {
        setLoadingData(false)
      }
    }

    fetchData()
  }, [orgSlug, houseSlug])

  const onSubmit = async (data: TicketFormData) => {
    setIsLoading(true)
    try {
      if (!house?.id) {
        throw new Error("House information not loaded")
      }

      // Convert "none" to undefined for eventId
      const submitData = {
        ...data,
        eventId: data.eventId === "none" ? undefined : data.eventId,
        houseId: house.id,
      }

      const res = await fetch(`/api/organizations/${orgSlug}/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to create ticket")
      }

      toast.success("Ticket created successfully!")
      router.push(`/organization/${orgSlug}/houses/${houseSlug}/tickets`)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (loadingData) {
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
          <Link href={`/organization/${orgSlug}/houses/${houseSlug}/tickets`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Create Ticket</h1>
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
        <Link href={`/organization/${orgSlug}/houses/${houseSlug}/tickets`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Ticket</h1>
          <p className="text-muted-foreground">
            Create a new ticket for {house.name}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ticket Details</CardTitle>
          <CardDescription>Configure your ticket settings</CardDescription>
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

            {/* Event Selection */}
            {events.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="eventId">Associated Event (Optional)</Label>
                <Select 
                  value={watch("eventId")}
                  onValueChange={(value) => setValue("eventId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an event (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No event (standalone ticket)</SelectItem>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {event.title}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Link this ticket to an event for better organization
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Ticket Name *</Label>
              <Input 
                id="name" 
                {...register("name")} 
                placeholder="e.g., General Admission, VIP Pass" 
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                {...register("description")} 
                rows={3} 
                placeholder="Describe what this ticket includes..."
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">Ticket Type</Label>
                <Select 
                  value={watch("type")}
                  onValueChange={(value) => setValue("type", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
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

              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  {...register("price", { valueAsNumber: true })}
                  placeholder="0.00"
                />
                {errors.price && (
                  <p className="text-sm text-red-500">{errors.price.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="totalQuantity">Total Quantity *</Label>
                <Input
                  id="totalQuantity"
                  type="number"
                  {...register("totalQuantity", { valueAsNumber: true })}
                  placeholder="100"
                />
                {errors.totalQuantity && (
                  <p className="text-sm text-red-500">{errors.totalQuantity.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxPerPurchase">Max Per Purchase *</Label>
                <Input
                  id="maxPerPurchase"
                  type="number"
                  {...register("maxPerPurchase", { valueAsNumber: true })}
                  placeholder="10"
                />
                {errors.maxPerPurchase && (
                  <p className="text-sm text-red-500">{errors.maxPerPurchase.message}</p>
                )}
              </div>
            </div>

            {/* Date Ranges */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Sales Period</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="salesStartAt">Sales Start *</Label>
                  <Input
                    id="salesStartAt"
                    type="datetime-local"
                    {...register("salesStartAt")}
                  />
                  {errors.salesStartAt && (
                    <p className="text-sm text-red-500">{errors.salesStartAt.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salesEndAt">Sales End *</Label>
                  <Input
                    id="salesEndAt"
                    type="datetime-local"
                    {...register("salesEndAt")}
                  />
                  {errors.salesEndAt && (
                    <p className="text-sm text-red-500">{errors.salesEndAt.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Validity Period</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="validFrom">Valid From *</Label>
                  <Input
                    id="validFrom"
                    type="datetime-local"
                    {...register("validFrom")}
                  />
                  {errors.validFrom && (
                    <p className="text-sm text-red-500">{errors.validFrom.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="validUntil">Valid Until *</Label>
                  <Input
                    id="validUntil"
                    type="datetime-local"
                    {...register("validUntil")}
                  />
                  {errors.validUntil && (
                    <p className="text-sm text-red-500">{errors.validUntil.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="memberOnly">Members Only</Label>
                  <p className="text-xs text-muted-foreground">
                    Only organization members can purchase
                  </p>
                </div>
                <Switch
                  id="memberOnly"
                  checked={watch("memberOnly")}
                  onCheckedChange={(checked) => setValue("memberOnly", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="requiresApproval">Requires Approval</Label>
                  <p className="text-xs text-muted-foreground">
                    Purchases need manual approval
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
                    Creating...
                  </>
                ) : (
                  "Create Ticket"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}