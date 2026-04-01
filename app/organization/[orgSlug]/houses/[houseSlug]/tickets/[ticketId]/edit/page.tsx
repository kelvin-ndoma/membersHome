// app/organization/[orgSlug]/houses/[houseSlug]/tickets/[ticketId]/edit/page.tsx
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
  status: z.enum(["ACTIVE", "DRAFT", "SOLD_OUT", "EXPIRED"]),
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

export default function EditTicketPage() {
  const router = useRouter()
  const params = useParams()
  const orgSlug = params.orgSlug as string
  const houseSlug = params.houseSlug as string
  const ticketId = params.ticketId as string

  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [house, setHouse] = useState<{ id: string; name: string } | null>(null)
  const [events, setEvents] = useState<Event[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "GENERAL_ADMISSION",
      status: "ACTIVE",
      price: 0,
      currency: "USD",
      totalQuantity: 100,
      maxPerPurchase: 10,
      memberOnly: false,
      requiresApproval: false,
      salesStartAt: "",
      salesEndAt: "",
      validFrom: "",
      validUntil: "",
      eventId: "none",
    },
  })

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch house data
        const houseRes = await fetch(`/api/organizations/${orgSlug}/houses/${houseSlug}`)
        if (houseRes.ok) {
          const houseData = await houseRes.json()
          setHouse(houseData)
        }

        // Fetch events for this house
        const eventsRes = await fetch(`/api/organizations/${orgSlug}/events?houseId=${house?.id || ""}&status=PUBLISHED`)
        if (eventsRes.ok) {
          const eventsData = await eventsRes.json()
          setEvents(eventsData.events || [])
        }

        // Fetch ticket data
        const ticketRes = await fetch(`/api/organizations/${orgSlug}/tickets/${ticketId}`)
        if (!ticketRes.ok) throw new Error("Ticket not found")
        const ticketData = await ticketRes.json()

        reset({
          name: ticketData.name,
          description: ticketData.description || "",
          type: ticketData.type,
          status: ticketData.status,
          price: ticketData.price,
          currency: ticketData.currency,
          totalQuantity: ticketData.totalQuantity,
          maxPerPurchase: ticketData.maxPerPurchase,
          memberOnly: ticketData.memberOnly,
          requiresApproval: ticketData.requiresApproval,
          salesStartAt: format(new Date(ticketData.salesStartAt), "yyyy-MM-dd'T'HH:mm"),
          salesEndAt: format(new Date(ticketData.salesEndAt), "yyyy-MM-dd'T'HH:mm"),
          validFrom: format(new Date(ticketData.validFrom), "yyyy-MM-dd'T'HH:mm"),
          validUntil: format(new Date(ticketData.validUntil), "yyyy-MM-dd'T'HH:mm"),
          eventId: ticketData.eventId || "none",
        })
      } catch (error) {
        console.error("Failed to load data", error)
        toast.error("Failed to load ticket data")
        router.push(`/organization/${orgSlug}/houses/${houseSlug}/tickets`)
      } finally {
        setIsLoadingData(false)
      }
    }

    fetchData()
  }, [orgSlug, houseSlug, ticketId, reset, router])

  const onSubmit = async (data: TicketFormData) => {
    setIsLoading(true)
    try {
      const submitData = {
        ...data,
        eventId: data.eventId === "none" ? null : data.eventId,
      }

      const res = await fetch(`/api/organizations/${orgSlug}/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to update ticket")
      }

      toast.success("Ticket updated successfully!")
      router.push(`/organization/${orgSlug}/houses/${houseSlug}/tickets/${ticketId}`)
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
            <h1 className="text-2xl font-bold tracking-tight">Edit Ticket</h1>
            <p className="text-muted-foreground">
              House not found
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
          <h1 className="text-2xl font-bold tracking-tight">Edit Ticket</h1>
          <p className="text-muted-foreground">
            Update ticket for {house.name}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="rounded-lg bg-muted/50 p-4 mb-4">
            <div className="flex items-center gap-2">
              <Home className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">House</p>
                <p className="font-medium">{house.name}</p>
              </div>
            </div>
          </div>
          <CardTitle>Ticket Details</CardTitle>
          <CardDescription>Update your ticket settings</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Ticket Name *</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...register("description")} rows={3} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">Ticket Type</Label>
                <Select 
                  value={watch("type")}
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
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="SOLD_OUT">Sold Out</SelectItem>
                    <SelectItem value="EXPIRED">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  {...register("price", { valueAsNumber: true })}
                />
                {errors.price && <p className="text-sm text-red-500">{errors.price.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalQuantity">Total Quantity *</Label>
                <Input
                  id="totalQuantity"
                  type="number"
                  {...register("totalQuantity", { valueAsNumber: true })}
                />
                {errors.totalQuantity && <p className="text-sm text-red-500">{errors.totalQuantity.message}</p>}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="maxPerPurchase">Max Per Purchase *</Label>
                <Input
                  id="maxPerPurchase"
                  type="number"
                  {...register("maxPerPurchase", { valueAsNumber: true })}
                />
                {errors.maxPerPurchase && <p className="text-sm text-red-500">{errors.maxPerPurchase.message}</p>}
              </div>
            </div>

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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salesEndAt">Sales End *</Label>
                  <Input
                    id="salesEndAt"
                    type="datetime-local"
                    {...register("salesEndAt")}
                  />
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="validUntil">Valid Until *</Label>
                  <Input
                    id="validUntil"
                    type="datetime-local"
                    {...register("validUntil")}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="memberOnly">Members Only</Label>
                  <p className="text-xs text-muted-foreground">Only organization members can purchase</p>
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
                  <p className="text-xs text-muted-foreground">Purchases need manual approval</p>
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