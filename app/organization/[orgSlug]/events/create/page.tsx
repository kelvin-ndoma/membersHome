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
import { ImageUpload } from "@/components/ui/ImageUpload"
import { toast } from "sonner"
import { MapPin, Video, Loader2, ArrowLeft, Home, Calendar } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

const eventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  timezone: z.string().default("UTC"),
  location: z.string().optional(),
  onlineUrl: z.string().url().optional().or(z.literal("")),
  type: z.enum(["IN_PERSON", "ONLINE", "HYBRID"]),
  isFree: z.boolean().default(true),
  memberOnly: z.boolean().default(false),
  capacity: z.number().int().positive().optional().nullable(),
  price: z.number().min(0).optional().nullable(),
  currency: z.string().default("USD"),
  houseId: z.string().min(1, "Please select a house for this event"),
})

type EventFormData = z.infer<typeof eventSchema>

export default function CreateEventPage() {
  const router = useRouter()
  const params = useParams()
  const orgSlug = params.orgSlug as string
  const [houses, setHouses] = useState<Array<{ id: string; name: string }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadingHouses, setLoadingHouses] = useState(true)
  const [publishNow, setPublishNow] = useState(true) // Default to publish
  const [tempStartDate, setTempStartDate] = useState("")
  const [tempEndDate, setTempEndDate] = useState("")
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedDateField, setSelectedDateField] = useState<"start" | "end">("start")

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "",
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
      timezone: "UTC",
      location: "",
      onlineUrl: "",
      type: "IN_PERSON",
      isFree: true,
      memberOnly: false,
      capacity: null,
      price: 0,
      currency: "USD",
      houseId: "",
    },
  })

  const eventType = watch("type")
  const isFree = watch("isFree")

  useEffect(() => {
    fetch(`/api/organizations/${orgSlug}/houses`)
      .then(res => res.json())
      .then(data => {
        setHouses(data.houses || [])
        setLoadingHouses(false)
      })
      .catch(error => {
        console.error("Failed to load houses", error)
        setLoadingHouses(false)
      })
  }, [orgSlug])

  const handleDateConfirm = () => {
    if (selectedDateField === "start" && tempStartDate) {
      setValue("startDate", tempStartDate)
    } else if (selectedDateField === "end" && tempEndDate) {
      setValue("endDate", tempEndDate)
    }
    setShowDatePicker(false)
  }

  const openDatePicker = (field: "start" | "end") => {
    setSelectedDateField(field)
    if (field === "start") {
      setTempStartDate(getValues("startDate"))
    } else {
      setTempEndDate(getValues("endDate"))
    }
    setShowDatePicker(true)
  }

  const onSubmit = async (data: EventFormData) => {
    setIsLoading(true)
    try {
      // Add status based on publishNow
      const submitData = {
        ...data,
        status: publishNow ? "PUBLISHED" : "DRAFT"
      }
      
      const res = await fetch(`/api/organizations/${orgSlug}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to create event")
      }

      const event = await res.json()
      toast.success(`Event created successfully! ${publishNow ? "It is now live." : "It is saved as a draft."}`)
      router.push(`/organization/${orgSlug}/events/${event.id}`)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (loadingHouses) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-4">
        <Link href={`/organization/${orgSlug}/events`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Event</h1>
          <p className="text-muted-foreground">
            Create a new event for your organization
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
          <CardDescription>
            Configure your event settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input id="title" {...register("title")} placeholder="Annual Conference, Workshop, etc." />
              {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Event Image</Label>
              <ImageUpload
                value={watch("imageUrl")}
                onChange={(url) => setValue("imageUrl", url)}
                onRemove={() => setValue("imageUrl", "")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...register("description")} rows={4} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="houseId">House *</Label>
              <Select onValueChange={(value) => setValue("houseId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a house for this event" />
                </SelectTrigger>
                <SelectContent>
                  {houses.map((house) => (
                    <SelectItem key={house.id} value={house.id}>
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        {house.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.houseId && <p className="text-sm text-red-500">{errors.houseId.message}</p>}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Start Date & Time *</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="text"
                      value={watch("startDate") ? format(new Date(watch("startDate")), "MMM d, yyyy h:mm a") : ""}
                      placeholder="Select start date"
                      className="pl-9 cursor-pointer"
                      onClick={() => openDatePicker("start")}
                      readOnly
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openDatePicker("start")}
                  >
                    Change
                  </Button>
                </div>
                {errors.startDate && <p className="text-sm text-red-500">{errors.startDate.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>End Date & Time *</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="text"
                      value={watch("endDate") ? format(new Date(watch("endDate")), "MMM d, yyyy h:mm a") : ""}
                      placeholder="Select end date"
                      className="pl-9 cursor-pointer"
                      onClick={() => openDatePicker("end")}
                      readOnly
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openDatePicker("end")}
                  >
                    Change
                  </Button>
                </div>
                {errors.endDate && <p className="text-sm text-red-500">{errors.endDate.message}</p>}
              </div>
            </div>

            {/* Date Picker Modal */}
            {showDatePicker && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="rounded-lg bg-background p-6 shadow-lg w-[350px]">
                  <h3 className="text-lg font-semibold mb-4">
                    {selectedDateField === "start" ? "Select Start Date & Time" : "Select End Date & Time"}
                  </h3>
                  <input
                    type="datetime-local"
                    value={selectedDateField === "start" ? tempStartDate : tempEndDate}
                    onChange={(e) => {
                      if (selectedDateField === "start") {
                        setTempStartDate(e.target.value)
                      } else {
                        setTempEndDate(e.target.value)
                      }
                    }}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowDatePicker(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleDateConfirm}
                    >
                      OK
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">Event Type</Label>
                <Select defaultValue="IN_PERSON" onValueChange={(value) => setValue("type", value as any)}>
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
            </div>

            {(eventType === "IN_PERSON" || eventType === "HYBRID") && (
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="location" {...register("location")} placeholder="Venue address" className="pl-9" />
                </div>
              </div>
            )}

            {(eventType === "ONLINE" || eventType === "HYBRID") && (
              <div className="space-y-2">
                <Label htmlFor="onlineUrl">Online Meeting URL</Label>
                <div className="relative">
                  <Video className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="onlineUrl" {...register("onlineUrl")} placeholder="https://zoom.us/..." className="pl-9" />
                </div>
                {errors.onlineUrl && <p className="text-sm text-red-500">{errors.onlineUrl.message}</p>}
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="memberOnly">Members Only</Label>
                  <p className="text-xs text-muted-foreground">Only organization members can attend</p>
                </div>
                <Switch
                  id="memberOnly"
                  checked={watch("memberOnly")}
                  onCheckedChange={(checked) => setValue("memberOnly", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isFree">Free Event</Label>
                  <p className="text-xs text-muted-foreground">No ticket cost for attendees</p>
                </div>
                <Switch
                  id="isFree"
                  checked={isFree}
                  onCheckedChange={(checked) => setValue("isFree", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="publishNow">Publish Immediately</Label>
                  <p className="text-xs text-muted-foreground">
                    Event will be visible to members right away
                  </p>
                </div>
                <Switch
                  id="publishNow"
                  checked={publishNow}
                  onCheckedChange={setPublishNow}
                />
              </div>
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
                  <p className="text-xs text-muted-foreground">Maximum number of attendees</p>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  publishNow ? "Create & Publish Event" : "Save as Draft"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}